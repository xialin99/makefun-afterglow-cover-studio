const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_CORE || 'playwright-core');

const root = path.resolve(__dirname, '..');
const screenshots = path.join(root, 'screenshots');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'afterglow-test-'));

async function main() {
  const browser = await chromium.launch({headless:true, executablePath:process.env.HEADLESS_CHROME});
  try {
    const context = await browser.newContext({viewport:{width:1280,height:880}, offline:true});
    const page = await context.newPage();
    const errors = [], remote = [];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',request=>{if(/^https?:/.test(request.url())) remote.push(request.url());});
    await page.goto(pathToFileURL(path.join(root,'app','index.html')).href);
    await page.evaluate(()=>document.fonts.ready.then(()=>true));
    const source = await page.evaluate(()=>drawDemo(1).toDataURL('image/png').split(',')[1]);
    const file = path.join(temporary,'original-lead.png');
    fs.writeFileSync(file,Buffer.from(source,'base64'));
    const input=page.locator('#file');
    await input.setInputFiles(file);
    await page.getByRole('status').getByText('Lead photo loaded.').waitFor();
    const snapshot=()=>page.locator('#cover').evaluate(canvas=>canvas.toDataURL());
    const before=await snapshot();
    await page.locator('#zoom').focus();
    await page.keyboard.press('End');
    assert.notEqual(await snapshot(),before);
    const zoomed=await snapshot();
    const box=await page.locator('#cover').boundingBox();
    await page.mouse.move(box.x+box.width*.49,box.y+box.height*.40);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width*.54,box.y+box.height*.48,{steps:5});
    await page.mouse.up();
    assert.notEqual(await snapshot(),zoomed);
    await page.getByRole('button',{name:'Reset framing'}).click();
    assert.equal(await snapshot(),before);
    for(const panel of ['Skyline','Street']){
      await page.getByRole('button',{name:panel,exact:true}).click();
      const chooser=page.waitForEvent('filechooser');
      await page.getByRole('button',{name:/Replace photo/}).click();
      await (await chooser).setFiles(file);
      await page.getByRole('status').getByText(panel+' photo loaded.').waitFor();
    }
    await page.getByRole('button',{name:'Use in all panels'}).click();
    await page.getByRole('status').getByText('Photo placed in all panels.').waitFor();
    await page.getByRole('button',{name:'Restore demo'}).click();
    const demoChooser=page.waitForEvent('filechooser');
    await page.getByRole('button',{name:/Replace photo/}).click();
    await (await demoChooser).setFiles(file);
    await page.getByRole('status').getByText('Lead photo loaded.').waitFor();
    const caption=page.getByLabel('Caption');
    await caption.fill('LOW TIDE');
    assert.notEqual(await snapshot(),before);
    await caption.fill('DUSK RUN');
    await page.screenshot({path:path.join(screenshots,'02-editor.jpg'),type:'jpeg',quality:88});
    const specs=[
      ['Wide',1920,1080,'01-wide.jpg'],
      ['Square',1080,1080,'03-square.jpg'],
      ['Portrait',1080,1350,'04-portrait.jpg']
    ];
    for(const [name,w,h,shot] of specs){
      await page.getByRole('button',{name:new RegExp('^'+name)}).click();
      const promise=page.waitForEvent('download');
      await page.getByRole('button',{name:/Download PNG/}).click();
      const download=await promise;
      const png=path.join(temporary,download.suggestedFilename());
      await download.saveAs(png);
      const data=fs.readFileSync(png);
      assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.deepEqual([data.readUInt32BE(16),data.readUInt32BE(20)],[w,h]);
      // Decode the exact downloaded PNG, scale proportionally and encode submission JPEG.
      const jpeg=await page.evaluate(async ({base64,w,h})=>{
        const image=new Image();
        image.src='data:image/png;base64,'+base64;
        await image.decode();
        const canvas=document.createElement('canvas');
        const scale=Math.min(1,1280/Math.max(w,h));
        canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);
        const g=canvas.getContext('2d');
        g.imageSmoothingQuality='high';
        g.drawImage(image,0,0,canvas.width,canvas.height);
        return canvas.toDataURL('image/jpeg',.89).split(',')[1];
      },{base64:data.toString('base64'),w,h});
      fs.writeFileSync(path.join(screenshots,shot),Buffer.from(jpeg,'base64'));
    }
    assert.deepEqual(errors,[]);
    assert.deepEqual(remote,[]);
    for(const name of fs.readdirSync(screenshots)) {
      const bytes=fs.statSync(path.join(screenshots,name)).size;
      assert(bytes<=262144,name+' exceeds the screenshot limit');
      console.log(name,bytes+' bytes');
    }
    console.log('Offline file URL, uploads, zoom, drag, reset, caption and all PNG exports passed.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{
  fs.rmSync(temporary,{recursive:true,force:true});
});
