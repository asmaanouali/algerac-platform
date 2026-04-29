const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  const emails = ['oec1@algeractestapp.dz', 'admin@algerac.dz', 'resp_tech@algeractestapp.dz'];
  for (const email of emails) {
    const loginRes = await ctx.request.post('http://localhost:8082/api/auth/login', { 
      data: { email, password: 'password123' } 
    });
    console.log(`Login for ${email}:`, loginRes.status(), await loginRes.text().catch(()=>''));
  }
  await browser.close();
})();
