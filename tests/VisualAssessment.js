// Visual assessment screenshots
const fs = require('fs');
const { chromium } = require('C:/Users/Ham/AppData/Roaming/npm/node_modules/playwright');

const GAME_URL = 'http://localhost:3001/games/NextDungeon/index.html';
const SCREENSHOTS_DIR = 'C:/codespace/WebGameFramework/tests/screenshots';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });

  try {
    await page.goto(GAME_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(500);
    await page.keyboard.press('Enter');
    await sleep(1000);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/visual-floor1-start.png` });
    console.log('Screenshot: visual-floor1-start.png');

    // Move around to explore
    await page.keyboard.press('ArrowRight'); await sleep(300);
    await page.keyboard.press('ArrowRight'); await sleep(300);
    await page.keyboard.press('ArrowDown'); await sleep(300);
    await page.keyboard.press('ArrowRight'); await sleep(300);
    await page.keyboard.press('ArrowRight'); await sleep(300);
    await page.keyboard.press('ArrowDown'); await sleep(300);

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/visual-floor1-explored.png` });
    console.log('Screenshot: visual-floor1-explored.png');

    // Fight an enemy
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight'); await sleep(200);
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/visual-combat.png` });
    console.log('Screenshot: visual-combat.png');

    // Trigger level up (kill some enemies first)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight'); await sleep(200);
      await page.keyboard.press('ArrowDown'); await sleep(200);
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/visual-xp-gain.png` });
    console.log('Screenshot: visual-xp-gain.png');

    console.log('\nVisual screenshots complete.');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
