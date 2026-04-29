const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') errs.push(`[${msg.type()}] ${msg.text()}`); });
  page.on('pageerror', e => errs.push(`[pageerror] ${e.message}\n${e.stack}`));

  const loginRes = await ctx.request.post('http://localhost:8082/api/auth/login', { 
    data: { email: 'oec1@algeractestapp.dz', password: 'password123' } 
  });
  console.log('login status:', loginRes.status());
  const loginBody = await loginRes.json();
  console.log('login body:', loginBody);

  if (loginBody.data && loginBody.data.user) {
    const userStr = JSON.stringify(loginBody.data.user);
    await page.addInitScript((user) => {
      window.localStorage.setItem('user', user);
    }, userStr);
    console.log('Added user to localStorage');
  }

  await page.goto('http://localhost:5173/oec/dashboard', { waitUntil: 'networkidle', timeout: 15000 }).catch(e=>console.log('nav err dash:',e.message));
  console.log('--- DASHBOARD ---');
  console.log('body length:', (await page.content()).length);
  const dashRoot = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
  console.log('root html length dash:', dashRoot);

  errs.length = 0;
  await page.goto('http://localhost:5173/oec/new-request', { waitUntil: 'networkidle', timeout: 15000 }).catch(e=>console.log('nav err nr:',e.message));
  await page.waitForTimeout(2000);
  console.log('--- NEW-REQUEST ---');
  console.log('body length:', (await page.content()).length);
  const nrRoot = await page.evaluate(() => document.getElementById('root')?.innerHTML?.length || 0);
  console.log('root html length nr:', nrRoot);
  console.log('first 1500 chars of root:', await page.evaluate(() => (document.getElementById('root')?.innerHTML || '').slice(0,1500)));
  console.log('errors:'); errs.forEach(e=>console.log(e));

  await browser.close();
})();
