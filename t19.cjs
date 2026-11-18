const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const [w,h] of [[1280,800],[400,800]]){
const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&!/font|ERR_/i.test(m.text())&&errs.push(m.text()));
for(const nm of ['أحمد','سارة']){
await p.goto('http://localhost:4173/');await p.evaluate(()=>localStorage.removeItem('odoo20-session'));await p.reload();await p.waitForTimeout(400);
await p.click('.auth-tabs button:nth-child(2)');await p.fill('.auth-card label:nth-of-type(1) input',nm);
const pw=p.locator('input[type=password]');await pw.nth(0).fill('1234');await pw.nth(1).fill('1234');await p.click('.auth-go');await p.waitForTimeout(400);await p.click('.hello .auth-go');
await p.click('.srchb');await p.fill('.srch-h input','Vendor');await p.waitForTimeout(2000);await p.keyboard.press('Escape');
await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await p.waitForTimeout(3500);}
await p.goto('http://localhost:4173/#admin');await p.waitForTimeout(500);
const setup=await p.locator('.auth-note').innerText();
await p.fill('input[type=email]','a@b.com');await p.fill('input[type=password]','secret12');await p.click('.auth-go');await p.waitForTimeout(500);
const rows=await p.locator('.adm-r').count();const kp=await p.locator('.adm-c b').allInnerTexts();
const txt=await p.locator('.adm-r').first().innerText();
await p.locator('.adm-r').first().click();const det=await p.locator('.adm-d').innerText();
const pwv=await p.evaluate(()=>/1234/.test(document.body.innerText));
await p.screenshot({path:`../adm_${w}.png`});
console.log(w,{setup:setup.slice(0,30),rows,kp,txt,det,pwShown:pwv,sw:await p.evaluate(()=>document.documentElement.scrollWidth),errs});
await ctx.close()}
await b.close()})()
