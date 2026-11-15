// node shoot.mjs <port> <outDir> : renders the retarget test page for a few clips and frames
import {createRequire} from 'module';
import fs from 'fs';
const require = createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium} = require('playwright');
const [port, out] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const pg = await b.newPage({viewport: {width: 1600, height: 800}});
pg.on('console', m => console.log('page:', m.text()));
pg.on('pageerror', e => console.log('pageerror:', e.message));
await pg.goto(`http://127.0.0.1:${port}/retarget.html`);
await pg.waitForFunction('window.ready', null, {timeout: 60000});
console.log(JSON.stringify(await pg.evaluate('window.info')));
for (const [clip, t, view] of [['idle', 0.5, 'face'], ['idle', 0.5, 'front'], ['hook', 0.3, 'front'], ['death', 2.0, 'side'], ['walk', 0.2, 'side'], ['walk', 0.55, 'side'], ['walk', 0.2, 'front'], ['jab', 0.25, 'front'], ['sit', 0.5, 'side']]) {
  const url = await pg.evaluate(([c, tt, v]) => window.pose(c, tt, v), [clip, t, view]);
  fs.writeFileSync(`${out}/${clip}_${t}_${view}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await b.close();
