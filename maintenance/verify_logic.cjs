'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx={console,Date,Set};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['data.js','core.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const C=ctx.KB_CORE,D=ctx.KB_DATA,checks=[];
function test(name,fn){fn();checks.push(name);}
function base(answers={}){const s=C.fresh();s.answers={...s.answers,os:'mac',phone:'iphone',...answers};return s;}
function ids(s){return C.route(D.steps,s).map(x=>x.id);}
test('已有 Plus 不重复进入 Apple、礼品卡或订阅路线',()=>{const s=base({chat:'plus',subscription:true});assert(!ids(s).some(id=>id.startsWith('apple-')||id.startsWith('gift-')||id.startsWith('plus-')));});
test('免费邮箱默认不购号、不接码、不进入 Apple 付费路线',()=>{const s=base();const r=ids(s);assert(r.includes('proton-free'));for(const id of ['google-buy','apple-buy','sms-code','auth-code','gift-buy','plus-pay'])assert(!r.includes(id));});
test('Google 示例订单与完整 2FA 分支分别按条件出现',()=>{const s=base({email:'google',google:'buy'});assert(ids(s).includes('google-fields'));assert(!ids(s).includes('auth-code'));s.answers.auth=true;assert(ids(s).includes('auth-code'));});
test('短信只由实际要求开关启用',()=>{const s=base();assert(!ids(s).includes('sms-code'));s.answers.sms=true;assert(ids(s).includes('sms-code'));});
test('Mac 与 Windows 安装步骤分开',()=>{const s=base({os:'windows'});assert(ids(s).includes('desktop-install-win'));assert(!ids(s).includes('desktop-install-mac'));});
test('新 Apple 账号建议等待，旧账号不重复等待',()=>{const s=base({subscription:true,apple:'register'});assert(ids(s).includes('apple-wait'));s.answers.apple='existing';assert(!ids(s).includes('apple-wait'));});
test('不支持的设备不可完成交接',()=>{const s=base({phone:'other'});for(const st of C.route(D.steps,s))C.complete(st,s,'done');assert(!C.canFinish(D.steps,s));assert(!ids(s).includes('gift-buy'));});
test('暂缓与待验证不能代替实际能力验收',()=>{const s=base({chat:'plus'});for(const st of C.route(D.steps,s))if(st.id!=='handoff')C.complete(st,s,'done');assert(C.canHandoff(D.steps,s));C.complete(D.steps.find(s=>s.id==='test-computer'),s,'deferred');assert(!C.canHandoff(D.steps,s));assert(!C.canFinish(D.steps,s));});
test('浏览器连接可按实际工具标为不适用，本地读取不能',()=>{const s=base({chat:'plus'});for(const st of C.route(D.steps,s))if(st.id!=='handoff')C.complete(st,s,'done');C.complete(D.steps.find(s=>s.id==='browser-connect'),s,'na');assert(C.canHandoff(D.steps,s));assert.throws(()=>C.complete(D.steps.find(s=>s.id==='test-local-read'),s,'na'));});
test('完整用户确认结果和最新包交接共同决定完成状态',()=>{const s=base({chat:'plus'});for(const st of C.route(D.steps,s))if(st.id!=='handoff')C.complete(st,s,'done');assert(C.canHandoff(D.steps,s));assert(!C.canFinish(D.steps,s));C.complete(D.steps.find(s=>s.id==='handoff'),s,'done');assert(C.canFinish(D.steps,s));});
test('更换系统、账号或工具后重新要求能力验收',()=>{const s=base({chat:'plus'});for(const st of C.route(D.steps,s))C.complete(st,s,'done');assert(C.canFinish(D.steps,s));const changed=C.changeAnswers(s,{...s.answers,os:'windows'},D.steps);assert(!C.canHandoff(D.steps,changed));assert(!changed.completed.handoff);assert(!changed.completed['test-computer']);assert(!changed.completed['desktop-login']);});
test('进度往返保留已完成步骤、等待和客服重试时间',()=>{const s=base({subscription:true});C.complete(D.steps[0],s,'done');s.firstUse='2026-10-18T10:30';s.waitChoice='waited';s.issue={code:'apple-payment',step:'plus-pay',retryAt:'2026-10-23T11:00'};const restored=C.sanitize(JSON.parse(JSON.stringify(s)),D.steps);assert.equal(restored.completed.network.status,'done');assert.equal(restored.firstUse,s.firstUse);assert.equal(restored.issue.retryAt,s.issue.retryAt);});
test('导入不接受任意字段、自由凭据、未知步骤或非法状态',()=>{const s=base();s.email='private@example.invalid';s.password='not-exported';s.answers.secret='not-exported';s.completed['<script>']={status:'done'};s.completed.network={status:'guessed',notes:'not-exported'};const clean=C.sanitize(s,D.steps);const text=JSON.stringify(clean);assert(!text.includes('private@example'));assert(!text.includes('not-exported'));assert(!text.includes('<script>'));assert(!clean.completed.network);assert.throws(()=>C.sanitize({schema:99},D.steps));});
console.log(JSON.stringify({passed:checks.length,checks},null,2));
