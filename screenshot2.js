const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto('http://localhost:3000');
  // Wait for loading animation to finish (2s) then a bit more
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/ss-ai-loading.png', fullPage: false });
  // Wait for advice to render
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/ss-ai-done.png', fullPage: true });
  await browser.close();
  console.log('Done');
})();
