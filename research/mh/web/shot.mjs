// node shot.mjs <port> <out.jpg> <glb path under research/mh> [view=face] [scale=2] : one large shot, for looking at a fault closely
import {createRequire} from 'module';
import fs from 'fs';
const require = createRequire('/Users/tomasjankauskas/Desktop/Projects/career-ops/');
const {chromium} = require('playwright');
const [port, out, file, view = 'face', scale = '2'] = process.argv.slice(2);
const b = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
const pg = await b.newPage({viewport: {width: 800, height: 600}});
pg.on('pageerror', e => console.log('pageerror:', e.message));
await pg.goto(`http://127.0.0.1:${port}/web/review.html`);
await pg.waitForFunction('window.ready', null, {timeout: 60000});
const url = await pg.evaluate(([f, v, s]) => window.show(f, v, s), [file, view, +scale]);
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
await b.close();
