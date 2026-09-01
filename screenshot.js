const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1600 });
  
  console.log("Navigating to http://localhost:3000 ...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  // Wait for data to load
  await page.waitForTimeout(5000); 

  console.log("Taking screenshot...");
  await page.screenshot({ path: 'screenshot.png', fullPage: true });
  
  await browser.close();
  console.log("Screenshot saved to screenshot.png");
})();
