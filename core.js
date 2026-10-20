(function (root) {
  'use strict';
  const defaults = {os:'', phone:'', mode:'guide', chat:'none', email:'proton', google:'existing', apple:'register', subscription:false, auth:false, sms:false};
  const enums = {os:['','mac','windows','other'], phone:['','iphone','other'], mode:['guide','browser','desktop'], chat:['none','free','plus'], email:['existing','proton','google'], google:['existing','register','buy'], apple:['existing','register','buy']};
  const booleans = ['subscription','auth','sms'];
  function fresh() { return {schema:1,version:'1.0.0',answers:{...defaults},completed:{},current:'network',firstUse:'',waitChoice:'',issue:null,updatedAt:new Date().toISOString()}; }
  function sanitize(raw, steps) {
    if (!raw || typeof raw !== 'object' || raw.schema !== 1) throw new Error('这不是本程序支持的进度卡。请使用本程序导出的 JSON 文件。');
    const out=fresh(), a=raw.answers||{}, ids=new Set(steps.map(s=>s.id));
    for (const [k,values] of Object.entries(enums)) if(values.includes(a[k])) out.answers[k]=a[k];
    for (const k of booleans) out.answers[k]=a[k]===true;
    if(out.answers.chat==='plus') out.answers.subscription=false;
    if(ids.has(raw.current)) out.current=raw.current;
    for(const id of ids) {
      const c=raw.completed && Object.prototype.hasOwnProperty.call(raw.completed,id) && raw.completed[id];
      if(c && ['done','deferred','na'].includes(c.status)) {
        const date=typeof c.at==='string' && !Number.isNaN(Date.parse(c.at)) ? new Date(c.at).toISOString() : '';
        out.completed[id]={status:c.status,at:date,evidence:c.status==='done'?'user-confirmed':c.status==='na'?'tool-not-required':'not-verified'};
      }
    }
    if(typeof raw.firstUse==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw.firstUse) && !Number.isNaN(Date.parse(raw.firstUse))) out.firstUse=raw.firstUse;
    if(['waited','declined'].includes(raw.waitChoice)) out.waitChoice=raw.waitChoice;
    if(raw.issue && ['email','auth','sms','apple-payment','entitlement','permission','unsupported'].includes(raw.issue.code) && ids.has(raw.issue.step)) {
      const retry=raw.issue.retryAt;
      out.issue={code:raw.issue.code,step:raw.issue.step,retryAt:typeof retry==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(retry)&&!Number.isNaN(Date.parse(retry))?retry:''};
    }
    return out;
  }
  function applies(step,a) {
    if(step.when.subscription && (a.phone!=='iphone' || a.chat==='plus')) return false;
    return Object.entries(step.when).every(([k,allowed])=>allowed.includes(typeof a[k]==='boolean'?(a[k]?'yes':'no'):a[k]));
  }
  function route(steps,state) { return steps.filter(s=>applies(s,state.answers)); }
  function isDone(step,state) { const c=state.completed[step.id]; return c?.status==='done' || (step.kind==='browser' && c?.status==='na'); }
  function preHandoff(steps,state) { return route(steps,state).filter(s=>s.id!=='handoff'); }
  function canHandoff(steps,state) { return ['mac','windows'].includes(state.answers.os) && state.answers.phone==='iphone' && preHandoff(steps,state).every(s=>isDone(s,state)); }
  function canFinish(steps,state) { return canHandoff(steps,state) && state.completed.handoff?.status==='done'; }
  function next(steps,state) { return route(steps,state).find(s=>!isDone(s,state)); }
  function changeAnswers(state,answers,steps) {
    const prev=JSON.stringify(state.answers), out=sanitize({...state,answers},steps);
    // A different account, device or tool invalidates prior delivery checks.
    if(prev!==JSON.stringify(out.answers)) {
      for(const s of steps) if(s.group==='验证电脑能力' || s.id==='handoff') delete out.completed[s.id];
      if(state.answers.os!==out.answers.os) for(const s of steps) if(s.group==='安装电脑端') delete out.completed[s.id];
      if(state.answers.chat!==out.answers.chat || state.answers.email!==out.answers.email || state.answers.google!==out.answers.google) for(const s of steps) if(s.group==='准备登录账号' || s.id==='desktop-login' || s.id==='phone-login') delete out.completed[s.id];
      if(state.answers.apple!==out.answers.apple) {for(const s of steps) if(s.group==='手机订阅（按需）') delete out.completed[s.id];out.firstUse='';out.waitChoice='';}
      if(state.answers.subscription!==out.answers.subscription || state.answers.phone!==out.answers.phone) for(const s of steps) if(s.group==='手机订阅（按需）') delete out.completed[s.id];
    }
    return out;
  }
  function complete(step,state,status) {
    if(!['done','deferred','na'].includes(status)) throw new Error('未知进度状态');
    if(status==='na' && step.kind!=='browser') throw new Error('只有按工具需要的浏览器连接可以标为不适用');
    state.completed[step.id]={status,at:new Date().toISOString(),evidence:status==='done'?'user-confirmed':status==='na'?'tool-not-required':'not-verified'};
    if(status!=='done' && step.id!=='handoff') delete state.completed.handoff;
    if(status==='done' && state.issue?.step===step.id)state.issue=null;
  }
  root.KB_CORE={fresh,sanitize,route,isDone,canHandoff,canFinish,next,changeAnswers,complete};
})(typeof window==='undefined'?globalThis:window);
