// Test NextDungeon stairs placement
const path = require('path');
const fs = require('fs');
const { chromium } = require('C:/Users/Ham/AppData/Roaming/npm/node_modules/playwright');

const GAME_URL = 'http://localhost:3001/games/NextDungeon/index.html';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Scan canvas for tile types and find entities
async function scanMap(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const TS = 32, OW = 26, OH = 20;
    const ox = (832 - OW * TS) / 2, oy = (640 - OH * TS) / 2;
    const img = ctx.getImageData(ox, oy, OW * TS, OH * TS);
    const d = img.data;

    const map = [];
    let player = null, stairsDown = null, stairsUp = null;

    for (let y = 0; y < OH; y++) {
      map[y] = [];
      for (let x = 0; x < OW; x++) {
        // Sample center of tile
        const i = ((y * TS + 14) * OW * TS + (x * TS + 14)) * 4;
        const r = d[i], g = d[i+1], b = d[i+2];

        let type = 'unknown';

        // Unexplored: black
        if (r < 10 && g < 10 && b < 10) {
          type = 'unexplored';
        }
        // Wall: #444
        else if (r > 55 && r < 75 && g > 55 && g < 75 && b > 55 && b < 75) {
          type = 'wall';
        }
        // Floor: #222
        else if (r > 25 && r < 45 && g > 25 && g < 45 && b > 25 && b < 45) {
          type = 'floor';
        }
        // Boss floor: #522
        else if (r > 70 && r < 90 && g > 25 && g < 45 && b > 20 && b < 40) {
          type = 'floor';
        }
        // Player or down stairs: #66ccff (blue)
        else if (r > 95 && r < 115 && g > 195 && g < 215 && b > 245 && b < 260) {
          type = 'floor';
          // Player is larger (24px square centered), stairs is smaller (16px)
          // Check corners - if corners are floor color, it's stairs (smaller entity)
          const cornerI = ((y * TS + 4) * OW * TS + (x * TS + 4)) * 4;
          const cr = d[cornerI], cg = d[cornerI+1], cb = d[cornerI+2];
          // If corner is also blue, it's the player (24px fills corners)
          if (cr > 95 && cr < 115 && cg > 195 && cg < 215 && cb > 245) {
            if (!player) player = { x, y };
          } else {
            if (!stairsDown) stairsDown = { x, y };
          }
        }
        // Up stairs: #ffcc66 (yellow)
        else if (r > 245 && g > 195 && g < 220 && b > 90 && b < 120) {
          type = 'floor';
          if (!stairsUp) stairsUp = { x, y };
        }
        // Other colored entities (enemies, etc) - treat as walkable for pathfinding
        else if (r > 40 || g > 40 || b > 40) {
          type = 'entity';
        }

        map[y][x] = type;
      }
    }
    return { map, player, stairsDown, stairsUp };
  });
}

// BFS pathfinding from start to target
function bfsPath(map, start, target) {
  const OH = map.length, OW = map[0].length;
  const visited = Array.from({ length: OH }, () => Array(OW).fill(false));
  const queue = [{ x: start.x, y: start.y, path: [] }];
  visited[start.y][start.x] = true;

  while (queue.length > 0) {
    const { x, y, path } = queue.shift();

    if (x === target.x && y === target.y) return path;

    const dirs = [
      { dx: 1, dy: 0, key: 'ArrowRight' },
      { dx: -1, dy: 0, key: 'ArrowLeft' },
      { dx: 0, dy: 1, key: 'ArrowDown' },
      { dx: 0, dy: -1, key: 'ArrowUp' },
    ];

    for (const { dx, dy, key } of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < OW && ny >= 0 && ny < OH && !visited[ny][nx]) {
        const tile = map[ny][nx];
        if (tile === 'floor' || tile === 'entity') {
          visited[ny][nx] = true;
          queue.push({ x: nx, y: ny, path: [...path, key] });
        }
      }
    }
  }
  return null;
}

async function main() {
  console.log('=== NextDungeon Stairs Test ===\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

  try {
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    // Floor 1: find stairs
    let scan = await scanMap(page);
    console.log('F1 Player:', scan.player, 'StairsDown:', scan.stairsDown);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/test-f1-start.png` });

    if (!scan.player || !scan.stairsDown) {
      console.log('Could not identify player/stairs');
      await browser.close();
      return;
    }

    const stairs1Pos = scan.stairsDown;

    // Navigate to stairs using BFS
    let attempts = 0;
    let floorChanged = false;

    while (!floorChanged && attempts < 10) {
      scan = await scanMap(page);
      if (!scan.player) break;

      const path = bfsPath(scan.map, scan.player, stairs1Pos);
      console.log(`Attempt ${attempts + 1}: Path length=${path ? path.length : 'none'}`);

      if (path && path.length > 0) {
        for (const key of path) {
          await page.keyboard.press(key);
          await sleep(250);
        }
        await sleep(400);
      } else {
        // No path found with current vision, explore by moving toward stairs
        const dx = stairs1Pos.x - scan.player.x;
        const dy = stairs1Pos.y - scan.player.y;
        const dir = Math.abs(dx) > Math.abs(dy) ?
          (dx > 0 ? 'ArrowRight' : 'ArrowLeft') :
          (dy > 0 ? 'ArrowDown' : 'ArrowUp');
        await page.keyboard.press(dir);
        await sleep(300);
      }

      attempts++;

      // Check if floor changed
      const floor = await page.$eval('#floorDisplay', e => e.textContent);
      if (floor !== '1') {
        floorChanged = true;
        console.log('Floor changed to:', floor);
      }
    }

    const floor = await page.$eval('#floorDisplay', e => e.textContent);
    console.log('Current floor:', floor);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/test-f1-attempted.png` });

    if (floor === '2') {
      console.log('\nFloor 2 reached!');

      // Find yellow up-stairs on floor 2
      scan = await scanMap(page);
      console.log('F2 Player:', scan.player, 'StairsUp:', scan.stairsUp);
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/test-f2.png` });

      if (scan.stairsUp) {
        const upstairsPos = scan.stairsUp;
        console.log('\nStairs1(down) at:', stairs1Pos);
        console.log('Stairs2(up) at:', upstairsPos);

        if (upstairsPos.x === stairs1Pos.x && upstairsPos.y === stairs1Pos.y) {
          console.log('✓ PASS: Up stairs match down stairs position!');
        } else {
          console.log('✗ FAIL: Positions do not match');
        }

        // Navigate to up-stairs and go back up
        let upAttempts = 0;
        let wentUp = false;

        while (!wentUp && upAttempts < 10) {
          scan = await scanMap(page);
          if (!scan.player || !scan.stairsUp) break;

          const path = bfsPath(scan.map, scan.player, scan.stairsUp);
          if (path && path.length > 0) {
            for (const key of path) {
              await page.keyboard.press(key);
              await sleep(250);
            }
            await sleep(400);
          }

          upAttempts++;
          const f2 = await page.$eval('#floorDisplay', e => e.textContent);
          if (f2 === '1') {
            wentUp = true;
            console.log('Returned to Floor 1');
          }
        }

        await page.screenshot({ path: `${SCREENSHOTS_DIR}/test-back-f1.png` });

        // Verify down stairs on floor 1
        scan = await scanMap(page);
        console.log('\nF1 Player:', scan.player, 'StairsDown:', scan.stairsDown);

        if (scan.stairsDown && upstairsPos) {
          if (scan.stairsDown.x === upstairsPos.x && scan.stairsDown.y === upstairsPos.y) {
            console.log('✓ PASS: Down stairs on F1 match up stairs on F2!');
          } else {
            console.log('✗ FAIL: Positions do not align');
          }
        }
      } else {
        console.log('No yellow up-stairs found on Floor 2');
      }
    } else {
      console.log('Could not reach Floor 2');
    }

    console.log('\n=== Test Complete ===');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
