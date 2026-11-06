const {chromium}=require('playwright'),assert=require('node:assert/strict');
const server=require('./server.cjs');
(async()=>{await new Promise(r=>server.listen(8563,'127.0.0.1',r));const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{const page=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8563');await page.waitForFunction(()=>MobileApp?.ready);
assert.equal(await page.locator('.view.active').getAttribute('id'),'home');assert.equal(await page.locator('[onclick]').count(),0);
await page.screenshot({path:'/workspace/artifacts/ui63-home.png'});
await page.locator('#home [data-action=table]').click();assert.equal(await page.evaluate(()=>MobileApp.project().layers52[0].kind),'table');
await page.locator('#home63').click();await page.locator('#home [data-action=glass]').click();assert.equal(await page.evaluate(()=>MobileApp.project().layers52.at(-1).material),'glass');
await page.locator('#home63').click();await page.locator('#home [data-action=motion]').click();await page.waitForSelector('#sheet[open]');assert.equal(await page.evaluate(()=>MobileApp.project().captions.length),1);await page.locator('#sheetClose').click();
await page.locator('#home63').click();await page.locator('#home [data-action=brand]').click();await page.locator('#sheetBody input[type=text]').fill('Test Brand');await page.getByRole('button',{name:'ذخیره روی همین دستگاه',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mobile63-brand')).name),'Test Brand');await page.locator('#sheetClose').click();
await page.screenshot({path:'/workspace/artifacts/ui63-editor.png'});
await page.locator('#home63').click();await page.locator('#home .bottom [data-action=servers]').click();assert.equal(await page.locator('#servers button[disabled]').count(),1);await page.locator('#servers [data-action=connect]').click();await page.waitForSelector('#sheet[open]');await page.locator('#sheetClose').click();
await page.locator('#home63').click();await page.locator('#home .accent[data-action=new]').click();await page.getByRole('button',{name:'ساخت پروژهٔ خالی · قابل بازگشت',exact:true}).click();assert.equal(await page.evaluate(()=>MobileApp.project().layers52.length),0);assert.equal(await page.evaluate(()=>MobileApp.project().captions.length),0);
for(let i=0;i<8;i++){await page.locator('#home63').click();await page.locator('#home .quick [data-action=editor]').click();}
assert.equal(await page.evaluate(()=>document.body.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
console.log('PASS v9 shell: real table/glass/text creation, brand persistence, server dialog, new empty project, repeated home/editor navigation, no inline scripts or page errors.');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
