const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);
  await page.click('text=栄養記録');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/ss-nutrition-form.png' });
  await browser.close();
  console.log('Done');
})();
