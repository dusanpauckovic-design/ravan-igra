const {chromium}=require(process.env.RAVAN_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const [html,out]=process.argv.slice(2);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.RAVAN_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader','--enable-unsafe-swiftshader','--single-process','--no-zygote','--disable-gpu-sandbox']});
 try {
 const p=await browser.newPage({viewport:{width:1280,height:800},offline:true});
 const errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 const cdp=await p.context().newCDPSession(p);
 const shot=async name=>{const img=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(img.data,'base64'));};
 const check=(label,value)=>{assert.ok(value,label);checks.push(label);console.log(label);};
 const click=selector=>p.locator(selector).evaluate(e=>e.click());
 await p.goto(pathToFileURL(path.resolve(html)).href);
 await p.waitForFunction(()=>document.querySelector('.rv-west-art')?.naturalWidth>500);
 check('Western Gate decodes in the live title screen',await p.locator('.rv-west-art').isVisible());
 await shot('Ravan_Zajednicki_Meni');
 await click('.rv-title [data-act="rpg-new"]');
 await p.locator('#creator-name').fill('Dule');
 check('Identity opens first',await p.locator('.rv-char-panel h2').textContent()==='Ko si ti?');
 await click('#creator-next');
 check('Appearance has a dedicated screen',await p.locator('.rv-char-panel h2').textContent()==='Izgled putnika');
 await p.waitForFunction(()=>document.querySelector('.rv-char-stage img')?.naturalHeight===1200);
 await click('#character-model-1');
 await p.waitForFunction(()=>document.querySelector('.rv-char-stage img')?.src===RavanFigure.modelArt('hero',1));
 check('108 HD models in the campaign creator',await p.evaluate(()=>RavanLoadout.models.hero.length===54&&RavanLoadout.models.hero_alt.length===54));
 await shot('Ravan_Zajednicki_Kreator');
 const route=fs.readFileSync(path.join(__dirname,'../QA/character-ui/route.js'),'utf8')
   .replace('await inspectModels(\'hero\');',"click('#creator-next'); await inspectModels('hero');")
   .replace("click('[data-option=hero_alt]');","click('#creator-back');click('[data-option=hero_alt]');click('#creator-next');")
   .replace("click('[data-option=hero]');","click('#creator-back');click('[data-option=hero]');click('#creator-next');");
 await p.evaluate(()=>{window.__routeConfig={capture:'full'};});
 await p.addScriptTag({content:route});
 await p.waitForFunction(()=>window.__routeResult,undefined,{polling:400,timeout:145000});
 const creator=await p.evaluate(()=>window.__routeResult);
 check('Existing creator-to-combat regression passes',creator.ok||console.error(creator.error));
 await p.evaluate(()=>{
 const C=RavanCore,s=C.newNarrativeGame('Putnica','hero_alt','strength',C.defaultProfile(),'forest');
 s.completed.push('opening');s.narrative.node='camp';s.narrative.soloIntro={phase:'trained',version:1};
 s.narrative.magicUnlocked=true;s.screen='map';s.overworld=RavanOverworld.create('know-4');
 s.overworld.trace={version:1,observed:true,resolved:true,result:'victory'};C.meetRadan(s);C.chooseFirstWeapon(s,'knife');
 RavanDebug.setState(s);window.campaignBefore=JSON.stringify(RavanWorldPort.snapshot());
 });
 await p.locator('.rv-open-approved-valley').waitFor();
 await click('.rv-open-approved-valley');
 const frame=await (await p.locator('.rv-approved-valley iframe').elementHandle()).contentFrame();
 assert.ok(frame);
 await frame.waitForFunction(()=>document.documentElement.dataset.ready==='true',undefined,{polling:400,timeout:90000});
 check('Embedded valley initializes WebGL with mist',await frame.evaluate(()=>ravanAudit().webgl2&&ravanAudit().fog.enabled));
 await shot('Ravan_Zajednicki_3D');
 await click('.rv-approved-valley header button');
 await p.locator('.rv-approved-valley').waitFor({state:'detached',timeout:90000});
 check('Opening and closing the 3D panel preserves the campaign snapshot',await p.evaluate(()=>window.campaignBefore===JSON.stringify(RavanWorldPort.snapshot())));
 check('No browser script errors',errors.length===0);
 fs.writeFileSync(path.join(out,'QA_zajednicki.json'),JSON.stringify({checks,creator:creator.checks,errors},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
