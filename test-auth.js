import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Login first
  await page.goto('http://localhost:3005/login');
  await page.type('input[type="email"]', 'kevin.monin@gmail.com');
  await page.type('input[type="password"]', 'azerty');
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  
  const token = await page.evaluate(() => {
    const sessionStr = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1].split('.')[0] + '-auth-token');
    if (!sessionStr) return null;
    const session = JSON.parse(sessionStr);
    return session.access_token;
  });

  console.log("Token:", token?.substring(0, 20) + "...");

  const res = await fetch('http://localhost:3005/api/admin/data', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Data/Error:", data);

  await browser.close();
})();
