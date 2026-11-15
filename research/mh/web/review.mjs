// node review.mjs <port> <outDir> [glbDir=glb] [pal] [views=front,back,face]
// Shots of every person in research/mh/<glbDir> as the game draws them; `pal` also measures each person's colours on screen
// and writes them into the person's JSON. The server must serve research/mh.
import {createRequire} from 'module';
import fs from 'fs';
const require = createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium} = require('playwright');
const [port, out, ...rest] = process.argv.slice(2);
const sub = rest.find(a => a !== 'pal' && !a.startsWith('views=')) || 'glb';
const views = (rest.find(a => a.startsWith('views=')) || 'views=front,back,face').slice(6).split(',');
fs.mkdirSync(out, {recursive: true});
const dir = new URL(`../${sub}/`, import.meta.url).pathname;
const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const pg = await b.newPage({viewport: {width: 800, height: 600}});
pg.on('pageerror', e => console.log('pageerror:', e.message));
await pg.goto(`http://127.0.0.1:${port}/web/review.html`);
await pg.waitForFunction('window.ready', null, {timeout: 60000});
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.glb')).sort()) {
  for (const v of views) {
    const url = await pg.evaluate(([f, v]) => window.show(f, v), [`${sub}/${f}`, v]);
    fs.writeFileSync(`${out}/${f.slice(0, -4)}_${v}.jpg`, Buffer.from(url.split(',')[1], 'base64'));
  }
  if (rest.includes('pal')) {
    const j = `${dir}${f.slice(0, -4)}.json`, meta = JSON.parse(fs.readFileSync(j, 'utf8'));
    meta.pal = await pg.evaluate(f => window.pal(f), `${sub}/${f}`);
    fs.writeFileSync(j, JSON.stringify(meta));
  }
}
await b.close();
