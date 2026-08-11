// NextDungeon Bug Analysis - Playwright Test Suite
// Tests actual game mechanics and finds bugs
const { chromium } = require('playwright');

(async () => {
  const bugs = [];
  const warnings = [];
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await context.newPage();

  console.log('🧪 NextDungeon Bug Analysis Test Suite');
  console.log('======================================\n');

  await page.goto('http://localhost:3000/games/NextDungeon/index.html', { waitUntil: 'load', timeout: 15000 });
  await page.waitForSelector('#gameCanvas', { timeout: 10000 });
  console.log('✅ Game loaded\n');

  // Inject helper to expose game state for testing
  await page.evaluate(() => {
    // Monkey-patch the GameFramework to expose state after game starts
    const origCreateGame = window.GF.createGame;
    window.GF.createGame = function(...args) {
      const game = origCreateGame(...args);
      // After game starts, we'll have access to State through game.scenes
      const checkState = setInterval(() => {
        const scenes = game.scenes || game._scenes;
        if (scenes && scenes._scenes && scenes._scenes.length > 0) {
          const activeScene = scenes._scenes[scenes._scenes.length - 1];
          if (activeScene && typeof activeScene === 'object') {
            // We can't directly access State from here due to IIFE scope
            // But we CAN access it via closure by adding to window
            clearInterval(checkState);
          }
        }
      }, 100);
      return game;
    };
  });

  // Click to start game
  await page.click('#gameCanvas');
  await page.waitForTimeout(1000);

  // Add global State access via script injection BEFORE the game script runs
  // We need to do this differently - let's just access via canvas rendering
  console.log('--- Test 1: Verify Game Started ---');
  const floorDisplay = await page.locator('#floorDisplay').textContent();
  const hpDisplay = await page.locator('#hpDisplay').textContent();
  console.log(`Floor: ${floorDisplay}, HP: ${hpDisplay}`);

  if (floorDisplay === '1' && hpDisplay.includes('/')) {
    console.log('✅ Game started successfully\n');
  } else {
    bugs.push('Game did not start properly');
  }

  // Test 2: Player movement via canvas pixel analysis
  console.log('--- Test 2: Player Movement (Canvas Analysis) ---');
  const canvas = await page.locator('#gameCanvas');
  
  // Take screenshot before movement
  const beforeScreenshot = await canvas.screenshot();
  
  // Try moving in all directions
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
  }
  
  const afterScreenshot = await canvas.screenshot();
  
  // Compare screenshots - if they're different, player moved
  const moved = !buffersEqual(beforeScreenshot, afterScreenshot);
  console.log(moved ? '✅ Player movement works' : '❌ Player did not move!');
  console.log('');
  
  if (!moved) {
    bugs.push('CRITICAL: Player cannot move - input system not working');
  }

  // Test 3: Check HP calculation
  console.log('--- Test 3: HP Calculation ---');
  const hpParts = hpDisplay.split('/');
  const currentHp = parseInt(hpParts[0]);
  const maxHp = parseInt(hpParts[1]);
  
  // Starting stats: CON=10, Level=1
  // maxHp = 20 + CON*3 + (level-1)*5 = 20 + 30 + 0 = 50
  const expectedMaxHp = 20 + 10 * 3 + 0;
  console.log(`HP: ${currentHp}/${maxHp}, Expected maxHp: ${expectedMaxHp}`);
  
  if (maxHp === expectedMaxHp && currentHp === maxHp) {
    console.log('✅ HP calculation is correct\n');
  } else {
    bugs.push(`HP calculation wrong: got ${maxHp}, expected ${expectedMaxHp}`);
  }

  // Test 4: Enemy rendering via canvas colors
  console.log('--- Test 4: Enemy Spawning (Canvas Color Analysis) ---');
  // Check if there are any green/purple/brown pixels on canvas (enemy colors)
  const enemyPixels = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let enemyPixelCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      // Check for enemy colors: green (#44aa44, #448844), brown (#886644), purple (#8844cc)
      // Also red for boss, white for skeleton
      if ((g > 100 && r < 100 && b < 100) || // green enemies
          (r > 100 && g > 80 && b < 80) ||    // brown enemies
          (r > 100 && g < 100 && b > 150) ||  // purple enemies
          (r > 200 && g > 200 && b > 200)) {  // white skeleton
        enemyPixelCount++;
      }
    }
    return enemyPixelCount;
  });
  
  console.log(`Enemy-colored pixels found: ${enemyPixels}`);
  if (enemyPixels > 100) {
    console.log('✅ Enemies appear to be spawning\n');
  } else {
    warnings.push('No enemies detected on canvas - may not be spawning');
  }

  // Test 5: Stairs visibility (blue/yellow pixels)
  console.log('--- Test 5: Stairs Rendering ---');
  const stairsPixels = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      // Blue stairs (#66ccff) or yellow stairs (#ffcc66)
      if ((b > 200 && g > 150 && r < 150) || // blue
          (r > 200 && g > 150 && b < 150)) {  // yellow
        count++;
      }
    }
    return count;
  });
  
  console.log(`Stairs-colored pixels: ${stairsPixels}`);
  if (stairsPixels > 50) {
    console.log('✅ Stairs are rendering\n');
  } else {
    warnings.push('Stairs may not be visible');
  }

  // Test 6: XP Bar visibility
  console.log('--- Test 6: XP Bar ---');
  const xpBarWidth = await page.locator('#xpBar').evaluate(el => el.style.width);
  const xpText = await page.locator('#xpText').textContent();
  console.log(`XP Bar: ${xpBarWidth}, XP Text: ${xpText}`);
  
  if (xpBarWidth && xpText.includes('/')) {
    console.log('✅ XP bar is rendering\n');
  } else {
    bugs.push('XP bar not rendering properly');
  }

  // Test 7: Game log functionality
  console.log('--- Test 7: Game Log ---');
  const logEntries = await page.locator('#gameLog .log-entry').allTextContents();
  console.log(`Log entries (${logEntries.length}):`);
  logEntries.forEach(e => console.log(`  ${e}`));
  
  if (logEntries.length >= 3 && logEntries.some(e => e.includes('Welcome'))) {
    console.log('✅ Game log is working\n');
  } else {
    bugs.push('Game log not functioning');
  }

  // Test 8: Fog of War (check if entire canvas is visible)
  console.log('--- Test 8: Fog of War ---');
  const blackPixels = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let blackCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 10 && data[i+1] < 10 && data[i+2] < 10) {
        blackCount++;
      }
    }
    return blackCount;
  });
  
  const totalPixels = 832 * 640;
  const blackRatio = (blackPixels / totalPixels * 100).toFixed(1);
  console.log(`Black (unexplored) pixels: ${blackPixels} (${blackRatio}% of screen)`);
  
  if (blackRatio > 20) {
    console.log('✅ Fog of war is active - unexplored areas exist\n');
  } else {
    warnings.push('Fog of war may not be working - most of map visible');
  }

  // Test 9: Try to trigger combat by moving more
  console.log('--- Test 9: Combat Trigger Test ---');
  // Move around a lot to potentially encounter enemies
  for (let i = 0; i < 20; i++) {
    const dirs = ['ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown'];
    await page.keyboard.press(dirs[i % 4]);
    await page.waitForTimeout(100);
  }
  
  const logAfter = await page.locator('#gameLog .log-entry').allTextContents();
  const combatLog = logAfter.find(e => e.includes('hit') || e.includes('damage') || e.includes('miss'));
  const hpAfter = await page.locator('#hpDisplay').textContent();
  
  if (combatLog) {
    console.log(`✅ Combat triggered: ${combatLog}`);
    console.log(`HP after combat: ${hpAfter}\n`);
  } else {
    console.log(`No combat triggered after 20 moves`);
    console.log(`HP unchanged: ${hpAfter}`);
    warnings.push('Could not verify combat system - no enemies encountered');
    console.log('');
  }

  // Test 10: Check for stairs on same tile as player (after going down)
  console.log('--- Test 10: Stairs Position Bug Check ---');
  // Find stairs and try to go down
  const stairsInfo = await page.evaluate(() => {
    // Analyze canvas to find stairs position
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Look for blue stair tile (#66ccff)
    const TILE_SIZE = 32;
    for (let y = 0; y < canvas.height / TILE_SIZE; y++) {
      for (let x = 0; x < canvas.width / TILE_SIZE; x++) {
        const px = x * TILE_SIZE + 16;
        const py = y * TILE_SIZE + 16;
        const idx = (py * canvas.width + px) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        if (b > 200 && g > 150 && r < 150) {
          return { tileX: x, tileY: y, color: 'blue' };
        }
        if (r > 200 && g > 150 && b < 150) {
          return { tileX: x, tileY: y, color: 'yellow' };
        }
      }
    }
    return null;
  });
  
  if (stairsInfo) {
    console.log(`Stairs found at tile (${stairsInfo.tileX}, ${stairsInfo.tileY}) - ${stairsInfo.color}`);
    console.log('✅ Stairs position is detectable\n');
  } else {
    console.log('❌ Could not locate stairs on map\n');
    warnings.push('Stairs may not be rendering in expected location');
  }

  // Test 11: Check for potential stuck player on stairs after floor change
  console.log('--- Test 11: Floor Transition Stuck Player Bug ---');
  // This bug: after going down stairs, player spawns on new floor with stairs 'up' at their position
  // But setupGame() re-places stairs in exit room, overwriting the 'up' stairs
  // So player cannot go back up!
  console.log('CODE ANALYSIS (floor transition):');
  console.log('  - nextFloor() sets stairs.direction = "up", stairs.pos = player.pos');
  console.log('  - THEN setupGame() runs, placing new stairs in exit room with direction="down"');
  console.log('  - Result: "up" stairs are OVERWRITTEN - cannot return to previous floor!');
  console.log('  - prevFloor() exists but stairs.direction is never "up" when on new floor');
  bugs.push('BUG: Cannot return to previous floors - stairs direction bug in nextFloor()');
  console.log('');

  // Test 12: Check level-up screen
  console.log('--- Test 12: Level-Up System ---');
  console.log('CODE ANALYSIS:');
  console.log('  - levelUp() uses while loop for consecutive level-ups');
  console.log('  - BUT showLevelUpScreen() is called ONCE after the loop');
  console.log('  - Result: if you gain enough XP for 3 levels, you get 3 points');
  console.log('  - But only see level-up screen once, missing intermediate level messages');
  warnings.push('UX Issue: Consecutive level-ups only show screen once');
  console.log('');

  // Test 13: Enemy AI line of sight
  console.log('--- Test 13: Enemy AI (Code Analysis) ---');
  console.log('CODE ANALYSIS:');
  console.log('  - Enemies chase player if distance < 10');
  console.log('  - BUT no line-of-sight check - enemies see through walls');
  console.log('  - This is typical for roguelikes, but worth noting');
  console.log('  - Enemies get stuck trying to move through walls');
  console.log('');

  // Test 14: Check NPC spawning floor
  console.log('--- Test 14: NPC Spawning ---');
  console.log('CODE ANALYSIS:');
  console.log('  - NPCs spawn when: floor > 1 && floor % 10 === 1');
  console.log('  - This means NPCs appear on floors 11, 21, 31, ...');
  console.log('  - NOT on floors 10, 20, 30 as a player might expect');
  console.log('  - Consider changing to floor % 10 === 0 for more intuitive timing');
  warnings.push('UX Issue: NPC floor timing (11,21,31...) is unintuitive');
  console.log('');

  // Test 15: Check enemy HP bar rendering
  console.log('--- Test 15: Enemy HP Bars ---');
  const hpBarPixels = await page.evaluate(() => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let greenBar = 0, redBar = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      if (g > 200 && r < 100 && b < 100) greenBar++; // #44ff44
      if (r > 200 && g < 100 && b < 100) redBar++;   // #ff4444
    }
    return { greenBar, redBar };
  });
  
  console.log(`HP bar pixels - green: ${hpBarPixels.greenBar}, red: ${hpBarPixels.redBar}`);
  if (hpBarPixels.greenBar > 0 && hpBarPixels.redBar > 0) {
    console.log('✅ Enemy HP bars are rendering\n');
  } else {
    console.log('⚠️ HP bars may not be visible (or no enemies nearby)\n');
  }

  // Summary
  console.log('======================================');
  console.log('📊 BUG ANALYSIS SUMMARY');
  console.log('======================================\n');
  
  if (bugs.length > 0) {
    console.log(`❌ BUGS FOUND (${bugs.length}):`);
    bugs.forEach((b, i) => console.log(`  ${i+1}. ${b}`));
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️ WARNINGS/IMPROVEMENTS (${warnings.length}):`);
    warnings.forEach((w, i) => console.log(`  ${i+1}. ${w}`));
    console.log('');
  }
  
  if (bugs.length === 0 && warnings.length === 0) {
    console.log('✅ No issues found!');
  }
  
  console.log('\n🎮 Recommended Fixes:');
  console.log('1. Fix stairs bug: save stairs position BEFORE calling setupGame() in nextFloor()');
  console.log('2. Fix level-up: show level-up screen INSIDE while loop for each level');
  console.log('3. Consider adding line-of-sight for enemies (optional for roguelike)');
  console.log('4. Change NPC spawning to floor % 10 === 0 for intuitive timing');
  console.log('5. Add visual feedback when player tries to move into a wall');
  console.log('6. Increase vision radius from 3 to 4-5 tiles');
  
  await page.waitForTimeout(3000);
  await browser.close();
  
  process.exit(bugs.length);
})();

// Helper to compare Buffer objects
function buffersEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
