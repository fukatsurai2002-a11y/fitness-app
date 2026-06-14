const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/screenshot-dashboard.png', fullPage: false });
  await page.click('text=筋トレ記録');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/screenshot-workout.png', fullPage: false });
  await page.click('text=栄養記録');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/fukat/suntory-app/screenshot-nutrition.png', fullPage: false });
  await browser.close();
  console.log('Done');
})();
