// NextDungeon automated test script using Playwright
const { chromium } = require('playwright');

(async () => {
  const issues = [];
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();

  console.log('🧪 NextDungeon Automated Test Suite');
  console.log('====================================\n');

  // Navigate to the game
  await page.goto('http://localhost:3000/games/NextDungeon/index.html', { waitUntil: 'load', timeout: 15000 });
  console.log('✅ Page loaded');

  // Wait for canvas and game initialization
  await page.waitForSelector('#gameCanvas', { timeout: 10000 });
  console.log('✅ Canvas found');

  // Test 1: Title Screen
  console.log('\n--- Test 1: Title Screen ---');
  const titleText = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    return canvas.toDataURL(); // Just verify canvas renders
  });
  console.log('✅ Title screen rendering');

  // Click to start game
  await page.click('#gameCanvas');
  await page.waitForTimeout(1000);
  console.log('✅ Game started via canvas click');

  // Test 2: Check game state initialized
  console.log('\n--- Test 2: Game State Initialization ---');
  const gameState = await page.evaluate(() => {
    return window.GF ? { gameExists: !!window.game } : { gameExists: false };
  });
  console.log('Game state:', gameState);
  
  // Check if player stats are visible
  const floorDisplay = await page.locator('#floorDisplay').textContent();
  const hpDisplay = await page.locator('#hpDisplay').textContent();
  const levelDisplay = await page.locator('#levelDisplay').textContent();
  console.log(`Floor: ${floorDisplay}, HP: ${hpDisplay}, Level: ${levelDisplay}`);
  
  if (!floorDisplay || !hpDisplay || !levelDisplay) {
    issues.push('UI stats not displaying after game start');
  } else {
    console.log('✅ UI stats are displayed');
  }

  // Test 3: Player movement
  console.log('\n--- Test 3: Player Movement ---');
  const positionsBefore = await page.evaluate(() => {
    return window.GF && window.GF.State ? { 
      x: window.GF.State.player.x, 
      y: window.GF.State.player.y 
    } : { x: null, y: null };
  });
  console.log('Position before:', positionsBefore);

  // Try moving right
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  
  // Try moving down
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(200);

  const positionsAfter = await page.evaluate(() => {
    return window.GF && window.GF.State ? { 
      x: window.GF.State.player.x, 
      y: window.GF.State.player.y 
    } : { x: null, y: null };
  });
  console.log('Position after:', positionsAfter);

  if (positionsBefore.x !== null && positionsBefore.y !== null) {
    if (positionsBefore.x === positionsAfter.x && positionsBefore.y === positionsAfter.y) {
      issues.push('Player did not move when pressing Arrow keys - might be blocked by walls');
    } else {
      console.log('✅ Player movement works');
    }
  }

  // Test 4: Check enemy spawning and combat
  console.log('\n--- Test 4: Enemy Spawning and Combat ---');
  const enemyInfo = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (state && state.enemies) {
      return {
        count: state.enemies.length,
        types: state.enemies.map(e => e.name).join(', ')
      };
    }
    return { count: 0, types: 'none' };
  });
  console.log('Enemies:', enemyInfo);
  
  if (enemyInfo.count === 0 && enemyInfo.types === 'none') {
    issues.push('No enemies spawned on floor');
  } else {
    console.log(`✅ ${enemyInfo.count} enemies spawned: ${enemyInfo.types}`);
  }

  // Test 5: Check game log
  console.log('\n--- Test 5: Game Log ---');
  const logEntries = await page.locator('#gameLog .log-entry').allTextContents();
  console.log('Log entries:', logEntries);
  
  if (logEntries.length === 0) {
    issues.push('Game log is empty - events not being logged');
  } else {
    console.log(`✅ ${logEntries.length} log entries present`);
  }

  // Test 6: Check for stuck enemies (enemies that can't move but block path)
  console.log('\n--- Test 6: Enemy Pathing ---');
  const stuckCheck = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.player || !state.enemies || !state.map) return null;
    
    // Check if any enemy is on a wall
    const stuckEnemies = state.enemies.filter(e => 
      state.map[e.y] && state.map[e.y][e.x] && state.map[e.y][e.x].type === 'wall'
    );
    
    // Check if player is on stairs
    const playerOnStairs = state.player.x === state.stairs.x && state.player.y === state.stairs.y;
    
    return {
      stuckEnemies: stuckEnemies.length,
      playerOnStairs: playerOnStairs,
      stairsDir: state.stairs.direction
    };
  });
  console.log('Stuck check:', stuckCheck);
  
  if (stuckCheck && stuckCheck.stuckEnemies > 0) {
    issues.push(`${stuckCheck.stuckEnemies} enemies stuck on walls`);
  } else if (stuckCheck) {
    console.log('✅ No stuck enemies detected');
  }

  // Test 7: Check XP bar updates
  console.log('\n--- Test 7: XP System ---');
  const xpInfo = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (state && state.player) {
      return {
        xp: state.player.xp,
        xpReq: state.player.xpReq,
        level: state.player.level
      };
    }
    return { xp: null, xpReq: null, level: null };
  });
  console.log('XP:', xpInfo);
  
  if (xpInfo.xp === null) {
    issues.push('XP system not initialized');
  } else {
    console.log(`✅ XP system active: ${xpInfo.xp}/${xpInfo.xpReq}`);
  }

  // Test 8: Check if stairs are visible and reachable
  console.log('\n--- Test 8: Stairs Navigation ---');
  const stairsCheck = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.stairs || !state.map) return null;
    
    const tile = state.map[state.stairs.y][state.stairs.x];
    const isFloor = tile && (tile.type === 'floor' || tile.type === 'boss_floor');
    const isSeen = tile && tile.seen;
    
    return {
      x: state.stairs.x,
      y: state.stairs.y,
      direction: state.stairs.direction,
      isFloor: isFloor,
      isSeen: isSeen
    };
  });
  console.log('Stairs:', stairsCheck);
  
  if (stairsCheck && !stairsCheck.isFloor) {
    issues.push('Stairs placed on non-floor tile');
  } else if (stairsCheck) {
    console.log('✅ Stairs properly placed');
  }

  // Test 9: Check for potential infinite game loop or stuck state
  console.log('\n--- Test 9: Game Loop Stability ---');
  let moveCount = 0;
  const maxMoves = 50;
  
  for (let i = 0; i < maxMoves; i++) {
    const posBefore = await page.evaluate(() => {
      const s = window.GF?.State;
      return s?.player ? { x: s.player.x, y: s.player.y, hp: s.player.hp } : null;
    });
    
    if (!posBefore) break;
    
    // Random movement
    const moves = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    await page.keyboard.press(moves[Math.floor(Math.random() * 4)]);
    await page.waitForTimeout(100);
    
    const posAfter = await page.evaluate(() => {
      const s = window.GF?.State;
      return s?.player ? { x: s.player.x, y: s.player.y, hp: s.player.hp } : null;
    });
    
    if (!posAfter) {
      issues.push('Game crashed during movement test');
      break;
    }
    
    if (posBefore.x !== posAfter.x || posBefore.y !== posAfter.y) moveCount++;
    
    // Check if game is over
    const gameOver = await page.locator('#gameOverScreen').isVisible();
    if (gameOver) {
      console.log('⚠️ Game over reached after', i, 'moves');
      break;
    }
  }
  
  console.log(`✅ Moved ${moveCount}/${maxMoves} times (some blocked by walls/enemies)`);

  // Test 10: Check vision/fog of war system
  console.log('\n--- Test 10: Vision/Fog of War ---');
  const visionCheck = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.map || !state.player) return null;
    
    let seenTiles = 0;
    let visitedTiles = 0;
    const totalTiles = state.map.length * state.map[0].length;
    
    for (let y = 0; y < state.map.length; y++) {
      for (let x = 0; x < state.map[y].length; x++) {
        if (state.map[y][x].seen) seenTiles++;
        if (state.map[y][x].visited) visitedTiles++;
      }
    }
    
    return { seenTiles, visitedTiles, totalTiles };
  });
  console.log('Vision:', visionCheck);
  
  if (visionCheck && visionCheck.seenTiles === visionCheck.totalTiles) {
    issues.push('Fog of war not working - all tiles are visible');
  } else if (visionCheck) {
    console.log(`✅ Fog of war active: ${visionCheck.seenTiles}/${visionCheck.totalTiles} seen`);
  }

  // Test 11: Check for potential issue - player on stairs auto-descending
  console.log('\n--- Test 11: Stairs Auto-Descent Bug Check ---');
  // Move toward stairs and check behavior
  const stairsTest = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.stairs || !state.player) return null;
    
    // Calculate distance to stairs
    const dx = state.stairs.x - state.player.x;
    const dy = state.stairs.y - state.player.y;
    const distance = Math.abs(dx) + Math.abs(dy);
    
    return {
      playerX: state.player.x,
      playerY: state.player.y,
      stairsX: state.stairs.x,
      stairsY: state.stairs.y,
      distance: distance,
      floor: state.floor
    };
  });
  console.log('Stairs test:', stairsTest);

  // Test 12: Check for enemy on stairs overlap issue
  console.log('\n--- Test 12: Entity Overlap Check ---');
  const overlapCheck = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.stairs || !state.player) return null;
    
    let overlaps = [];
    
    // Check enemies on stairs
    const enemyOnStairs = state.enemies.find(e => e.x === state.stairs.x && e.y === state.stairs.y);
    if (enemyOnStairs) overlaps.push(`Enemy ${enemyOnStairs.name} on stairs`);
    
    // Check player on stairs (might be intentional after descending)
    if (state.player.x === state.stairs.x && state.player.y === state.stairs.y && state.floor === 1) {
      overlaps.push('Player on stairs at floor 1 (should be on down stairs only after going down)');
    }
    
    // Check enemy on player position
    const enemyOnPlayer = state.enemies.find(e => e.x === state.player.x && e.y === state.player.y);
    if (enemyOnPlayer) overlaps.push(`Enemy ${enemyOnPlayer.name} on player`);
    
    return overlaps;
  });
  console.log('Overlaps:', overlapCheck);
  
  if (overlapCheck && overlapCheck.length > 0) {
    issues.push(`Entity overlaps found: ${overlapCheck.join('; ')}`);
  } else {
    console.log('✅ No entity overlaps detected');
  }

  // Test 13: Check for NPC interaction trigger (nearby check without moving INTO them)
  console.log('\n--- Test 13: NPC Interaction ---');
  const npcCheck = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state) return null;
    
    // NPCs appear every 10 floors starting from floor 1
    const shouldHaveNpc = state.floor > 1 && state.floor % 10 === 1;
    
    return {
      npcsOnMap: state.npcs ? state.npcs.length : 0,
      npcsJoined: state.npcsJoined ? state.npcsJoined.length : 0,
      shouldHaveNpc: shouldHaveNpc,
      floor: state.floor
    };
  });
  console.log('NPCs:', npcCheck);
  
  if (npcCheck && npcCheck.floor % 10 === 1 && npcCheck.floor > 1 && npcCheck.npcsOnMap === 0) {
    issues.push('NPC should appear on this floor but none found');
  } else {
    console.log('✅ NPC system seems OK (floor', npcCheck?.floor, ')');
  }

  // Test 14: Check canvas focus and input handling
  console.log('\n--- Test 14: Input Focus ---');
  // Click elsewhere then try to move
  await page.click('body', { position: { x: 50, y: 50 } });
  await page.waitForTimeout(500);
  
  // Try pressing a key - should still work if game doesn't require canvas focus
  const focusCheck = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.player) return null;
    return { x: state.player.x, y: state.player.y };
  });
  
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(200);
  
  const focusAfter = await page.evaluate(() => {
    const state = window.GF ? window.GF.State : null;
    if (!state || !state.player) return null;
    return { x: state.player.x, y: state.player.y };
  });
  
  if (focusCheck && focusAfter && 
      (focusCheck.x !== focusAfter.x || focusCheck.y !== focusAfter.y)) {
    console.log('✅ Input works even when canvas not focused');
  } else {
    issues.push('Input may require canvas focus - user might need to click canvas first');
  }

  // Test 15: Check for potential issue - no feedback when blocked by wall
  console.log('\n--- Test 15: Wall Collision Feedback ---');
  // Try to move into a wall (edge of map is walls)
  // This test checks if there's any feedback when the player tries to move into a wall
  const wallTest = await page.evaluate(() => {
    const log = document.getElementById('gameLog');
    const entries = Array.from(log.querySelectorAll('.log-entry')).map(e => e.textContent);
    return {
      totalEntries: entries.length,
      last5Entries: entries.slice(-5)
    };
  });
  console.log('Wall test:', wallTest);
  
  // If moving into a wall produces no log entry, that's expected for a roguelike
  // But it could be confusing for new players
  console.log('ℹ️ Note: No feedback when moving into walls (may be confusing for new players)');

  // Summary
  console.log('\n====================================');
  console.log('📊 Test Summary');
  console.log('====================================');
  
  if (issues.length === 0) {
    console.log('✅ No issues found!');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  process.exit(issues.length);
})();
