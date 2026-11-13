const {chromium}=require(process.env.RAVAN_PLAYWRIGHT || 'playwright');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const [html,out]=process.argv.slice(2);
const options=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--single-process','--no-zygote','--disable-gpu-sandbox'];

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.RAVAN_CHROMIUM,args:options});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800},offline:true,reducedMotion:'reduce'});
    // SwiftShader can take several seconds per frame. Drive the preview clock at
    // fixed frame increments while still rendering the actual scene and interactions.
    await page.addInitScript(()=>{
      const request=window.requestAnimationFrame.bind(window);
      let timestamp=0;
      window.requestAnimationFrame=callback=>request(now=>{
        timestamp=Math.max(timestamp,now)+1800;
        callback(timestamp);
      });
    });
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>window.ravanAudit());
    const wait=fn=>page.waitForFunction(fn,undefined,{polling:250,timeout:125000});
    const tap=async point=>page.mouse.click(point.x,point.y);
    const press=id=>page.locator(id).click();
    const checks=[];
    const check=(label,condition)=>{assert.ok(condition,label);checks.push(label);console.log(label);};
    const cdp=await page.context().newCDPSession(page);
    const shot=async name=>{
      const img=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true});
      fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(img.data,'base64'));
    };
    await page.goto(pathToFileURL(path.resolve(html)).href);
    await wait(()=>document.documentElement.dataset.ready==='true');
    const initial=await state();
    check('Fog is enabled, has short range, and hides the far bank locations',
      initial.fog.enabled&&initial.fog.radius===19&&initial.fog.known.length===1&&initial.fog.bank===-1);
    await press('#center');
    await shot('RAVAN_Putnik_Magla');
    await tap((await state()).nearby);
    await wait(()=>window.ravanAudit().clock>.39);
    await wait(()=>window.ravanAudit().remainingDays===0);
    const step=await state();
    check('Short exploration step advances time and moves the line of sight',
      step.party[0]>initial.party[0]+8&&String(step.party)===String(step.fog.center));
    await press('#light');
    await press('#zoom-out');await press('#zoom-out');
    await tap((await state()).deep);
    check('Deep river rejects the click',await page.locator('#status').textContent()==='Duboka voda. Potrazi kameni gaz.');
    await press('#overview');
    await page.waitForTimeout(1000);
    await shot('RAVAN_Povezana_Dolina');
    await page.locator('[data-place="marsh"]').click();
    const eta=await page.locator('#eta').textContent();
    check('Wetlands route is presented as about two game days',eta.includes('2 dana'));
    await press('#quality');
    await page.evaluate(()=>document.getElementById('travel').click());
    const started=await state();
    const departureClock=step.clock;
    check('Distance is measured in days',Math.abs(started.journeyDays-2)<.22);
    await page.evaluate(()=>document.getElementById('light').click());
    await wait(()=>window.ravanAudit().crossing!==null).catch(async e=>{console.log(await state());throw e;});
    const approach=await state();
    check('Ford encounter is discovered on arrival, before reaching the opposite bank',
      approach.crossing.kind==='tracks'&&approach.fog.bank===-1&&!approach.fog.known.includes('grove'));
    await shot('RAVAN_Na_Gazu');
    await page.waitForTimeout(1400);
    check('The traveler and clock pause at the ford',(await state()).clock===approach.clock);
    await press('#crossing-go');
    await wait(()=>window.ravanAudit().fog.bank===1);
    check('Crossing reveals the far bank from the traveler', (await state()).fog.bank===1);
    await wait(()=>window.ravanAudit().origin==='marsh');
    const arrived=await state();
    check('Wetlands arrival uses the estimated duration and records the newly discovered area',
      Math.abs(arrived.clock-departureClock-started.journeyDays)<.04&&arrived.fog.known.includes('marsh')&&Math.floor(arrived.clock)===2);
    await shot('RAVAN_Mokre_Livade');
    await page.setViewportSize({width:390,height:844});
    await press('#center');
    await page.waitForTimeout(900);
    check('Mobile has the clock, local selector and no horizontal overflow',
      await page.locator('#clock').isVisible()&&await page.locator('#place-list').isVisible()&&
      await page.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
    await shot('RAVAN_Putovanje_Mobilni');
    check('No JavaScript or WebGL errors',errors.length===0);
    fs.writeFileSync(path.join(out,'QA.json'),JSON.stringify({browser:browser.version(),checks,eta,initial,step,approach,arrived,errors},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
