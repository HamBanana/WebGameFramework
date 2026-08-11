// Playwright visual test for NextDungeon
// Run: node tests/NextDungeonVisualTest.js

const path = require('path');
const { chromium } = require('C:/Users/Ham/AppData/Roaming/npm/node_modules/playwright');

const GAME_URL = 'http://localhost:3001/games/NextDungeon/index.html';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'tests', 'screenshots');

// Ensure screenshots directory exists
const fs = require('fs');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting NextDungeon visual test...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage({
    viewport: { width: 1024, height: 768 },
  });
  
  try {
    // Navigate to the game
    console.log('Navigating to game...');
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(1000);
    
    // Screenshot title screen
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-title-screen.png`, fullPage: false });
    console.log('Screenshot: 01-title-screen.png');
    
    // Start the game by pressing Enter
    console.log('Starting game...');
    await page.keyboard.press('Enter');
    await sleep(1500);
    
    // Screenshot floor 1
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-floor-1-start.png`, fullPage: false });
    console.log('Screenshot: 02-floor-1-start.png');
    
    // Move around a bit to explore
    console.log('Exploring floor 1...');
    await page.keyboard.press('ArrowRight');
    await sleep(300);
    await page.keyboard.press('ArrowRight');
    await sleep(300);
    await page.keyboard.press('ArrowDown');
    await sleep(300);
    await page.keyboard.press('ArrowRight');
    await sleep(300);
    await page.keyboard.press('ArrowRight');
    await sleep(300);
    await page.keyboard.press('ArrowDown');
    await sleep(300);
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-floor-1-exploring.png`, fullPage: false });
    console.log('Screenshot: 03-floor-1-exploring.png');
    
    // Navigate towards the stairs (they should be in the last room, generally right/down)
    console.log('Navigating to stairs on floor 1...');
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight');
      await sleep(200);
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowDown');
      await sleep(200);
    }
    
    await sleep(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-approaching-stairs-floor-1.png`, fullPage: false });
    console.log('Screenshot: 04-approaching-stairs-floor-1.png');
    
    // Try to find and go down the stairs (blue stairs)
    // Continue moving until we hit the stairs
    console.log('Going down stairs...');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('ArrowRight');
      await sleep(150);
    }
    
    await sleep(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/05-on-stairs-floor-1.png`, fullPage: false });
    console.log('Screenshot: 05-on-stairs-floor-1.png');
    
    // Check log for floor change
    const logContent = await page.$eval('#gameLog', el => el.textContent);
    console.log('\nGame log so far:');
    console.log(logContent.split('\n').slice(-10).join('\n'));
    
    // Move down to trigger stairs
    console.log('\nTriggering stairs descent...');
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowDown');
      await sleep(200);
    }
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ArrowRight');
      await sleep(200);
    }
    
    await sleep(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/06-floor-2-with-upstairs.png`, fullPage: false });
    console.log('Screenshot: 06-floor-2-with-upstairs.png');
    
    const logContent2 = await page.$eval('#gameLog', el => el.textContent);
    console.log('\nGame log after going down:');
    console.log(logContent2.split('\n').slice(-10).join('\n'));
    
    // Check floor display
    const floorDisplay = await page.$eval('#floorDisplay', el => el.textContent);
    console.log(`\nCurrent floor: ${floorDisplay}`);
    
    // Look for the yellow "up" stairs - they should be in the same position we went down
    console.log('\nLooking for yellow up-stairs on floor 2...');
    await page.keyboard.press('ArrowUp');
    await sleep(300);
    await page.keyboard.press('ArrowUp');
    await sleep(300);
    await page.keyboard.press('ArrowLeft');
    await sleep(300);
    await page.keyboard.press('ArrowLeft');
    await sleep(300);
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/07-seeking-upstairs-floor-2.png`, fullPage: false });
    console.log('Screenshot: 07-seeking-upstairs-floor-2.png');
    
    // Continue searching for stairs
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowUp');
      await sleep(200);
    }
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowLeft');
      await sleep(200);
    }
    
    await sleep(500);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/08-near-upstairs-floor-2.png`, fullPage: false });
    console.log('Screenshot: 08-near-upstairs-floor-2.png');
    
    // Check if we can go back up (should show floor 1 again)
    const logContent3 = await page.$eval('#gameLog', el => el.textContent);
    console.log('\nGame log after searching:');
    console.log(logContent3.split('\n').slice(-10).join('\n'));
    
    // Final floor check
    const finalFloor = await page.$eval('#floorDisplay', el => el.textContent);
    console.log(`\nFinal floor displayed: ${finalFloor}`);
    
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/09-final-state.png`, fullPage: false });
    console.log('Screenshot: 09-final-state.png');
    
    console.log('\n=== Test complete ===');
    console.log(`Screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nTo review:');
    console.log('- Compare 02-floor-1-start.png with stairs position');
    console.log('- Check 06-floor-2-with-upstairs.png for yellow up-stairs');
    console.log('- Verify up-stairs position matches where stairs were on floor 1');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
