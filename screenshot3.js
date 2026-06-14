const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(4500);
  // scroll to AI card
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/ss-ai-card.png', fullPage: false });
  await browser.close();
  console.log('Done');
})();
