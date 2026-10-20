const {JSDOM}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),checks=[];
function setup(url='https://offline-test.invalid/'){
  const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url,runScripts:'outside-only'}),w=dom.window;
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
  w.confirm=()=>true;let copied='',blob;
  Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async text=>copied=text}});
  w.URL.createObjectURL=b=>{blob=b;return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
  for(const file of ['data.js','core.js','app.js'])w.eval(fs.readFileSync(path.join(root,file),'utf8'));
  return {dom,w,doc:w.document,get copied(){return copied;},get blob(){return blob;}};
}
function setRoute(env,answers){const f=env.doc.querySelector('#settings-form');for(const[k,v]of Object.entries(answers)){const el=f.elements.namedItem(k);if(el.type==='checkbox')el.checked=v;else el.value=v;}f.dispatchEvent(new env.w.Event('submit',{bubbles:true,cancelable:true}));}
function click(env,selector){const el=env.doc.querySelector(selector);assert(el,'missing '+selector);el.click();}
function check(name,fn){fn();checks.push(name);}
const e=setup();
check('初次载入显示路线设置，未选设备不能确认完成',()=>{assert(e.doc.querySelector('#settings-dialog').open);assert(e.doc.querySelector('#confirm-step').disabled);});
check('保存 Mac＋iPhone＋已有 Plus 后显示正确路线',()=>{setRoute(e,{os:'mac',phone:'iphone',chat:'plus',subscription:false});assert(!e.doc.querySelector('#settings-dialog').open);assert(e.doc.querySelector('[data-step="desktop-install-mac"]'));assert(!e.doc.querySelector('[data-step="apple-buy"]'));assert(!e.doc.querySelector('[data-step="plus-pay"]'));});
check('勾选实际结果后才能完成，并切换下一步',()=>{assert(e.doc.querySelector('#complete-step').disabled);click(e,'#confirm-step');assert(!e.doc.querySelector('#complete-step').disabled);click(e,'#complete-step');assert(e.doc.querySelector('[data-step="network"]').classList.contains('done'));assert(e.doc.querySelector('[data-step="ai-entry"]').classList.contains('active'));});
check('未完成电脑验收时 Claude 交接按钮不可用',()=>{click(e,'[data-step="handoff"]');assert(e.doc.querySelector('[data-action="handoff"]').disabled);assert(e.doc.querySelector('#confirm-step').disabled);});
check('本地资料读取提示不泄露测试校验词',()=>{click(e,'[data-step="test-local-read"]');click(e,'[data-action="copy-step"]');assert(e.copied.includes('test-kit/read-me.txt'));assert(!e.copied.includes('CEDAR-4827'));});
check('完整资料库列出 23 页并支持正文搜索',()=>{click(e,'[data-action="library"]');assert.equal(e.doc.querySelectorAll('.library-item').length,23);const input=e.doc.querySelector('#library-search');input.value='Pockyt';input.dispatchEvent(new e.w.Event('input'));assert(e.doc.querySelectorAll('.library-item').length>0);assert(e.doc.querySelectorAll('.library-item').length<23);e.doc.querySelector('#library-dialog').close();});
check('错误恢复保存类型与客服时间，停在当前步',()=>{click(e,'[data-action="issue"]');e.doc.querySelector('#issue-code').value='apple-payment';e.doc.querySelector('#issue-code').dispatchEvent(new e.w.Event('change'));e.doc.querySelector('#retry-at').value='2026-10-23T11:30';click(e,'[data-action="save-issue"]');const s=JSON.parse(e.w.localStorage.getItem('codex-ready-v1-progress'));assert.equal(s.issue.code,'apple-payment');assert.equal(s.issue.retryAt,'2026-10-23T11:30');assert.equal(s.current,'test-local-read');assert.equal(s.completed['test-local-read'].status,'deferred');});
check('导出会生成 Blob 进度文件',()=>{click(e,'[data-action="export"]');assert(e.blob);});
check('等待 Apple 期间可继续后续独立电脑步骤，不被强制弹回等待',()=>{const w=setup();setRoute(w,{os:'mac',phone:'iphone',chat:'free',subscription:true,apple:'register'});click(w,'[data-step="apple-wait"]');click(w,'[data-action="defer"]');click(w,'[data-step="computer-plugin"]');click(w,'#confirm-step');click(w,'#complete-step');assert(w.doc.querySelector('[data-step="computer-permission"]').classList.contains('active'));w.dom.window.close();});
check('新账号首次使用时间是确认该步的必要信息',()=>{const w=setup();setRoute(w,{os:'windows',phone:'iphone',chat:'free',subscription:true,apple:'register'});click(w,'[data-step="apple-first-use"]');click(w,'#confirm-step');click(w,'#complete-step');assert(!JSON.parse(w.w.localStorage.getItem('codex-ready-v1-progress')).completed['apple-first-use']);w.dom.window.close();});
check('不支持的手机仅可阅读，不能确认交付',()=>{const w=setup();setRoute(w,{os:'windows',phone:'other',chat:'free'});assert(w.doc.querySelector('#confirm-step').disabled);assert(w.doc.querySelector('#scope-notice').textContent.includes('仅可阅读'));w.dom.window.close();});
check('本地文件模式即使存储不可用也能载入与导出',()=>{const w=setup('file:///local-test/index.html');setRoute(w,{os:'mac',phone:'iphone',chat:'plus'});assert(w.doc.querySelector('#save-status').textContent.includes('不可用'));click(w,'#confirm-step');click(w,'#complete-step');click(w,'[data-action="export"]');assert(w.blob);w.dom.window.close();});
(async()=>{
  const input=e.doc.querySelector('#import-file');
  const raw={schema:1,version:'1.0.0',answers:{os:'windows',phone:'iphone',chat:'plus',mode:'guide'},current:'desktop-login',completed:{network:{status:'done',at:new Date().toISOString()}},password:'do-not-retain'};
  Object.defineProperty(input,'files',{configurable:true,value:[{size:300,text:async()=>JSON.stringify(raw)}]});input.dispatchEvent(new e.w.Event('change'));await new Promise(r=>setImmediate(r));
  assert(e.doc.querySelector('[data-step="desktop-login"]').classList.contains('active'));assert(!e.w.localStorage.getItem('codex-ready-v1-progress').includes('do-not-retain'));checks.push('JSON 导入恢复当前步与合法记录，丢弃额外字段');
  console.log(JSON.stringify({passed:checks.length,environment:'jsdom 静态 DOM；非真实浏览器视觉验收',checks},null,2));e.dom.window.close();
})().catch(err=>{console.error(err);process.exitCode=1;});
