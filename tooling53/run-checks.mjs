import {spawnSync} from 'node:child_process';import path from 'node:path';
const root=path.resolve('..'),env={...process.env,NODE_PATH:path.resolve('node_modules')};
const tests=process.argv.includes('--browser')?['studio51_browser.cjs','studio52_browser.cjs','studio53_browser.cjs','studio54_browser.cjs','studio54_hosts_browser.cjs']:['run-release.cjs'];
for(const test of tests){const r=spawnSync(process.execPath,[path.join(root,'Varna_Motion_Studio/tests',test)],{stdio:'inherit',env,cwd:root});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
