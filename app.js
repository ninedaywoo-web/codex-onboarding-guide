(() => {
  'use strict';
  const D=window.KB_DATA,C=window.KB_CORE,$=s=>document.querySelector(s), KEY='codex-ready-v1-progress';
  let state=C.fresh(), storageOK=true, hasSaved=false, toastTimer;
  try { const saved=localStorage.getItem(KEY); if(saved){state=C.sanitize(JSON.parse(saved),D.steps);hasSaved=true;} } catch(e){storageOK=false;}
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={os:{mac:'Mac',windows:'Windows',other:'其他系统','':'尚未选择'},phone:{iphone:'iPhone',other:'其他手机','':'尚未选择'},mode:{guide:'图文指导',browser:'已实测可操作浏览器',desktop:'已实测可操作本机电脑'},chat:{none:'本次准备新账号',free:'已有账号，未订阅 Plus',plus:'已有 Plus'},email:{existing:'已有邮箱',proton:'Proton 免费邮箱',google:'本教程美区 Google 路线'}};
  const issues={
    email:{title:'收不到邮件',page:22,text:'核对完整邮箱拼写、当前收件箱和垃圾箱，再按页面等待或重发。不要为了收信重新创建另一个 ChatGPT 账号。'},
    auth:{title:'身份验证器动态码失败',page:10,text:'确认当前要求的是身份验证器数字码。完整复制 2FA 长串到 https://2fa.run/ 的 JS 实现区；不要只复制四字符，临近过期先等下一组。不要把密钥发进聊天。'},
    sms:{title:'短信验证问题',page:13,text:'先核对当前平台、允许的国家与号码类型。优先长期可控手机号。确实需要第三方服务才查 https://chuhai91.cc/ 的支持与售后；没有手机验证要求就不购买接码。'},
    'apple-payment':{title:'Apple 无法完成购买',page:20,text:'停止反复付款和追加充值。核对正确商店账号、实际余额和 App 内购买限制；到 https://getsupport.apple.com/ 按实际报错联系 Apple。问清等待起点与可重试时间；72 小时不是固定规定。'},
    entitlement:{title:'扣款后权益未显示',page:19,text:'先核对付款时的同一 ChatGPT 账号与商店账户，按页面提供的恢复购买入口处理；保留订单联系支持，不为了刷新权益再次付款。'},
    permission:{title:'电脑操作权限未生效',page:21,text:'核对实际产品、地区、账号和插件可用性。Mac 分别检查屏幕录制、辅助功能和应用授权；Windows 保持目标应用在活动桌面。系统确认由本人完成。工具不可用时先图文指导，实际操作测试保持待验证。'},
    unsupported:{title:'系统或安装入口不适用',page:21,text:'查看当前官方桌面说明的系统与硬件要求。入口可能因版本不同而变化，不下载不明兼容版；本首版暂不覆盖的设备可继续阅读，不能标记本机能力验收通过。'}
  };
  function issueHelp(){const item=issues[$('#issue-code').value];$('#issue-help').textContent=item.text;}
  function openIssue(){if(state.issue){$('#issue-code').value=state.issue.code;$('#retry-at').value=state.issue.retryAt||'';}else{$('#retry-at').value='';}issueHelp();show('#issue-dialog');}
  function route(){return C.route(D.steps,state);}
  function current(){return route().find(s=>s.id===state.current)||C.next(D.steps,state)||route()[0];}
  function toast(message){$('#toast').textContent=message;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',3800);}
  function save(){state.updatedAt=new Date().toISOString();try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch(e){storageOK=false;} $('#save-status').textContent=storageOK?'已保存在本浏览器；换设备前请导出。':'浏览器未允许本地保存，请使用“保存／恢复进度”导出。';}
  function show(id){const el=$(id);if(!el.open)el.showModal();}
  function setCurrent(id){if(!route().some(s=>s.id===id))return;state.current=id;save();render();}
  function summary(){const r=route(), done=r.filter(s=>C.isDone(s,state));return `Codex 准备进度（v${D.version}，用户记录，非自动检测）\n电脑：${labels.os[state.answers.os]}；手机：${labels.phone[state.answers.phone]}；当前 AI：${labels.mode[state.answers.mode]}\n账号：${labels.chat[state.answers.chat]}；手机订阅路线：${state.answers.subscription?'已选择':'未选择'}\n当前步骤：${current().title} [${current().id}]\n已确认 ${done.length}/${r.length} 步：${done.map(s=>s.id).join('、')||'无'}\n待验证／暂缓：${r.filter(s=>state.completed[s.id]?.status==='deferred').map(s=>s.id).join('、')||'无'}\n首次 App Store 成功使用：${state.firstUse||'未记录'}（客户当地时间）\n等待选择：${state.waitChoice==='waited'?'客户确认已完成约两天的经验建议等待':state.waitChoice==='declined'?'客户明确选择不采用约两天的经验建议':'未记录'}\n本地读取检查：${state.completed['test-local-read']?.status||'未验证'}；真实窗口操作检查：${state.completed['test-computer']?.status||'未验证'}\n当前卡点：${state.issue?issues[state.issue.code].title+'；步骤 '+state.issue.step+'；客服指定重试时间 '+(state.issue.retryAt||'未记录'):'无'}\n交接状态：${C.canFinish(D.steps,state)?'客户已确认最新包 ready 等结果；请核对实际记录':'尚未完成'}\n请从当前步骤继续，核对实际页面后再推进；不要索取或写入密码、密钥、验证码、卡密。`;}
  function prompt(step,all=false){
    let text=`请用简体中文称呼我为“您”，根据《Codex 准备引导》v${D.version}带我继续。目标是准备好我这台电脑的 Codex，然后交给 Claude 项目。先核对你当前实际工具能力：不能操作本机时就一小步一图指导，不假装已点击或已验收。\n\n${summary()}\n\n当前只做：[${step.id}] ${step.title}\n操作：${step.action}\n成功标志：${step.expect}\n注意：${step.note}\n原 PDF：第 ${step.page} 页。配图：${D.pages[step.page-1].image}（相对本包根目录）。请读取或展示这张已脱敏图片，不能只给文字丢失配图。\n`;
    if(step.url)text+=`入口及用途：${D.links[step.url]}（${step.title}）\n`;
    if(step.kind==='read-test')text+='请实际读取我交给你的本地包中 test-kit/read-me.txt，并报告其中的校验词。不要从网页提示、记忆或文件名猜测。无法读取就说明需要我怎样授权或选择文件夹，不标记通过。\n';
    if(step.kind==='computer-test')text+='必须使用实际 Computer Use 工具操作本机计算器窗口，输入 17 + 26，执行计算并读取真实屏幕结果。不要用 shell、脚本或口头算术替代。若需要应用授权，等待本人完成后继续。\n';
    text+='\n资料接入：能读本地文件时先读 AI_START.txt，再按 knowledge/steps.json 与 knowledge/full-guide.txt 对应步骤继续；支持 Skill 时读取本包 SKILL.md。不能访问本地资料时，请让我上传原版图解指南.pdf 或对应的已脱敏页图。不能看图时，明确说明，改由我对照本地引导页操作。\n每次只完成当前小步骤并核对结果。生物识别、系统授权和具体交易最终确认由本人处理；不需要把完整凭据写到聊天或进度里。';
    if(all)text+='\n\n本步原页正文：\n'+D.pages[step.page-1].text+'\n原页链接：\n'+D.pages[step.page-1].urls.join('\n');
    return text;
  }
  function handoff(){return `请接手我这台电脑后续的 Claude 配置。\n\n${summary()}\n\n请按 https://github.com/ninedaywoo-web/claude-setup-guide 的最新公开启动规则，实时获取并校验最新完整包，在新的目录中读取 SKILL.md 和要求的核心章节，返回真实的 ready、版本、提交与目录，再按新包从我的进度继续。不要只读取 version.json 就声称完整校验通过；不要复用旧缓存作为最新版。\n保留我目前可用的网络，不要提前断开。不要修改原教程或覆盖其他目录。每次只带我完成一个小步骤。已有账号、订阅、设备信息在不包含凭据的前提下复用，是否适用于 Claude 由新项目重新核对，不重复购买。\n原项目的配置、购买、手机工具和其他验收由它自己的最新版规则决定。本入口完成不代表 Claude 已配置成功，也不代表可以原生控制我的 iPhone。` ;}
  function copyPanel(text){$('#copy-text').value=text;show('#copy-dialog');$('#copy-text').focus();$('#copy-text').select();}
  async function copy(text){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);toast('已复制，可以粘贴给 AI。');return;}}catch(e){}copyPanel(text);toast('请在弹窗中选中文字复制。');}
  function render(){
    const r=route(),st=current();state.current=st.id;
    const passed=r.filter(s=>C.isDone(s,state)).length;
    $('#progress-count').textContent=`${passed} / ${r.length}`;$('#progress-bar').style.width=`${passed/r.length*100}%`;
    $('#save-status').textContent=storageOK?'进度保存在本浏览器；换设备前请导出。':'本地保存不可用，请导出进度卡。';
    const supported=['mac','windows'].includes(state.answers.os)&&state.answers.phone==='iphone';
    $('#scope-notice').innerHTML=!state.answers.os||!state.answers.phone?'<div class="notice">先在“路线设置”选择电脑和手机。您可以阅读全部资料，选择后再确认进度。</div>':!supported?'<div class="notice warning">本首版完整路线覆盖 Mac／Windows＋iPhone。您当前选择的设备仅可阅读资料，不会标记完成交付。请核对设备或等待对应路线补齐。</div>':'';
    $('#resume-note').innerHTML=state.issue?`<div class="notice warning">已记录卡点：${esc(issues[state.issue.code].title)}${state.issue.retryAt?'；客服指定重试：'+esc(state.issue.retryAt.replace('T',' ')):''}。可点“我遇到问题”查看处理方式。</div>`:hasSaved?'<div class="status-line">已恢复上次记录。步骤完成情况均为您确认的进度，不是自动检测结果。</div>':'';
    let group='';$('#step-nav').innerHTML=r.map((s,i)=>{let heading='';if(group!==s.group){group=s.group;heading=`<div class="nav-group">${esc(group)}</div>`;}const status=state.completed[s.id]?.status;return heading+`<button class="nav-step ${s.id===st.id?'active':''} ${C.isDone(s,state)?'done':status==='deferred'?'deferred':''}" data-step="${s.id}" ${s.id===st.id?'aria-current="step"':''}><span class="step-dot">${C.isDone(s,state)?'✓':status==='deferred'?'!':i+1}</span><span>${esc(s.title)}</span></button>`;}).join('');
    const locked=st.kind==='handoff'&&!C.canHandoff(D.steps,state);
    let extras='';
    if(st.kind==='gift-link')extras=`<div class="url-box"><div class="label">独立复制框：请复制整条网址，再粘贴到 iPhone 备忘录</div><textarea readonly rows="7" aria-label="完整支付宝直达链接">${esc(D.links.gift_alipay)}</textarea><button data-action="copy-gift">复制完整支付宝链接</button></div>`;
    if(st.kind==='first-use')extras=`<label class="inline-input">新账号首次在本人手机 App Store 成功使用的时间（您的当地时间）<input id="first-use" type="datetime-local" value="${esc(state.firstUse)}"></label><p class="subtle">已有长期使用账号可不填；新账号填写后才能确认本步。</p>`;
    if(st.kind==='wait'){
      const elapsed=state.firstUse?(Date.now()-new Date(state.firstUse).getTime())/3600000:0;
      extras=`<div class="notice red"><strong>新 Apple 账号：先成功登录并正常使用约两天，再充值订阅</strong><br>这是交付经验，不是官方规定，也不能保证解除限制。<br>${state.firstUse?`已记录首次时间 ${esc(state.firstUse.replace('T',' '))}，约经过 ${Math.max(0,Math.floor(elapsed))} 小时。`:'请先在“完成首次商店资料并记录时间”填写时间。'}</div><div class="check-options"><label><input type="radio" name="waitChoice" value="waited" ${state.waitChoice==='waited'?'checked':''}>我已正常使用约两天，再继续充值订阅</label><label><input type="radio" name="waitChoice" value="declined" ${state.waitChoice==='declined'?'checked':''}>我了解这是经验建议，明确选择不采用，继续按实际页面处理</label></div><p class="subtle">仍在等待可点“暂缓，继续其他准备”，从左侧进入电脑能力设置；等待不会自动标为通过。</p>`;
    }
    if(st.kind==='read-test')extras='<div class="test-kit">把已解压的本包目录交给 Codex。<a href="test-kit/read-me.txt" target="_blank" rel="noopener">您可打开本地测试文件核对答案 ↗</a><br>提示不会包含校验词；请核对 AI 是否实际读取了文件。</div>';
    if(st.kind==='computer-test')extras='<div class="test-kit">验收证据：真实计算器窗口被操作，显示 43。<br>本页没有控制电脑的接口；只有客户电脑上实际可用的 AI 工具能执行这项操作。</div>';
    if(locked){const missing=r.filter(s=>s.id!=='handoff'&&!C.isDone(s,state));extras+=`<div class="notice warning">尚有 ${missing.length} 项未确认，交接按钮暂未开放：${missing.map(s=>esc(s.title)).join('、')}。请从左侧返回处理。</div>`;}
    if(C.canFinish(D.steps,state)&&st.id==='handoff')extras+='<div class="completion"><h3>您的准备记录已完成</h3><p>您已确认本机回复、资料读取、实际窗口操作及最新包交接结果。请保存进度卡，在 Codex 中继续 Claude 项目。这里记录的是您核对的结果，本程序没有代为验证真实账号或交易。</p><button data-action="export" class="primary">保存完成记录</button></div>';
    $('#step-content').innerHTML=`<div class="step-meta"><span class="pill">${esc(st.group)}</span><span>第 ${r.indexOf(st)+1} / ${r.length} 步</span><span>PDF 第 ${st.page} 页</span>${st.takeover?'<span class="pill manual">需要本人确认／接管</span>':''}</div><h2>${esc(st.title)}</h2><p class="step-action">${esc(st.action)}</p>${st.url&&st.kind!=='gift-link'?`<a class="external" target="_blank" rel="noopener" href="${esc(D.links[st.url])}">${esc(D.links[st.url])} ↗</a>`:''}<div class="expected"><span class="label">完成后，您应该看到</span><p>${esc(st.expect)}</p></div>${st.note?`<div class="note"><span class="label">操作时留意</span><p>${esc(st.note)}</p></div>`:''}${extras}<div class="ai-actions"><button data-action="issue">我遇到问题</button><button data-action="copy-step">复制这一步给 AI</button><button data-action="copy-page">连同原页正文一起复制</button>${st.kind==='handoff'?`<button class="primary" data-action="handoff" ${locked||!supported?'disabled':''}>复制 Claude 交接提示</button>`:''}</div>${state.completed[st.id]?`<p class="status-line">当前记录：${state.completed[st.id].status==='done'?'您已确认完成':state.completed[st.id].status==='na'?'您已确认本工具不需要此连接':'暂缓／待验证'}${state.completed[st.id].at?' · '+esc(new Date(state.completed[st.id].at).toLocaleString()):''}</p>`:''}<label class="confirm"><input id="confirm-step" type="checkbox" ${!supported||locked?'disabled':''}><span>${st.kind==='handoff'?'我已看到 Codex 实际返回 ready、版本、提交和新目录，校验完整包后继续。':st.kind==='read-test'?'我已对照文件确认：Codex 实际读取了本地校验词。':st.kind==='computer-test'?'我确实看到 Codex 操作了真实计算器窗口，结果为 43。':'我已按上面的成功标志核对实际结果，确认这一步完成。'}</span></label><div class="step-buttons"><button id="complete-step" class="primary" disabled>${st.kind==='handoff'?'确认交接结果':'确认完成，继续'}</button>${st.kind==='browser'?'<button data-action="not-applicable">我的工具不需要此连接</button>':''}<button class="text-button" data-action="defer">暂缓，继续其他准备</button></div>`;
    $('#reference-title').textContent=`PDF 第 ${st.page} 页`;$('#reference-image').src=D.pages[st.page-1].image;$('#reference-image').alt=`第 ${st.page} 页：${D.pages[st.page-1].title}`;$('#reference-pdf').href=`原版图解指南.pdf#page=${st.page}`;
    $('#reference-note').innerHTML=[19,21,22].includes(st.page)?'<div class="reference-note">这一原页为文字步骤，没有实拍图。插件、权限与操作验收为首版补充说明；请依据客户当前真实界面，不把原页当作界面截图。</div>':'';
    $('#confirm-step').addEventListener('change',e=>$('#complete-step').disabled=!e.target.checked||locked||!supported);
    $('#complete-step').addEventListener('click',()=>{
      if(!$('#confirm-step').checked||!supported||locked)return;
      if(st.kind==='first-use'&&state.answers.apple!=='existing'&&!state.firstUse){toast('请先填写首次成功使用商店的时间。');return;}
      if(st.kind==='wait'&&(!state.firstUse||!state.waitChoice)){toast('请先记录首次时间，并明确选择等待安排。');return;}
      C.complete(st,state,'done');const list=route(),pos=list.findIndex(s=>s.id===st.id),eligible=s=>!C.isDone(s,state)&&(s.id!=='handoff'||C.canHandoff(D.steps,state));const next=list.slice(pos+1).find(eligible)||list.find(eligible);if(next)state.current=next.id;save();render();toast(st.kind==='handoff'?'交接结果已按您的确认记录。':'已记录您确认的结果。');
    });
    $('#first-use')?.addEventListener('change',e=>{const v=e.target.value;if(v&&new Date(v).getTime()>Date.now()){e.target.value=state.firstUse;toast('首次使用时间不能在未来。');return;}state.firstUse=v;state.waitChoice='';delete state.completed['apple-first-use'];delete state.completed['apple-wait'];delete state.completed.handoff;save();});
    document.querySelectorAll('input[name=waitChoice]').forEach(el=>el.addEventListener('change',e=>{state.waitChoice=e.target.value;delete state.completed['apple-wait'];delete state.completed.handoff;save();}));
  }
  function moveAfterDefer(st){const r=route(),index=r.findIndex(s=>s.id===st.id);const next=r.slice(index+1).find(s=>!C.isDone(s,state))||r.find(s=>s.id!==st.id&&!C.isDone(s,state));if(next)state.current=next.id;save();render();}
  function settings(){const form=$('#settings-form');for(const [k,v] of Object.entries(state.answers)){const el=form.elements.namedItem(k);if(el)if(el.type==='checkbox')el.checked=v;else el.value=v;}updateSettings();show('#settings-dialog');}
  function updateSettings(){const form=$('#settings-form');$('#google-field').hidden=form.elements.email.value!=='google';const sub=form.elements.subscription;sub.disabled=form.elements.chat.value==='plus'||form.elements.phone.value==='other';if(sub.disabled)sub.checked=false;}
  function library(){const q=$('#library-search').value.trim().toLowerCase();$('#library-grid').innerHTML=D.pages.filter(p=>(p.title+p.text).toLowerCase().includes(q)).map(p=>`<button class="library-item" data-page="${p.number}"><img src="${p.image}" alt="第 ${p.number} 页已脱敏原页" loading="lazy"><span>${esc(p.title)}</span></button>`).join('')||'<p class="empty">没有找到对应内容，请换一个关键词。</p>';}
  function imagePage(n){$('#large-image').src=D.pages[n-1].image;$('#large-image').alt=D.pages[n-1].title;$('#image-heading').textContent=`PDF 第 ${n} 页 · ${D.pages[n-1].title}`;show('#image-dialog');}
  function exportProgress(){const clean=C.sanitize(state,D.steps);clean.updatedAt=new Date().toISOString();const blob=new Blob([JSON.stringify(clean,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Codex准备进度_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('已生成进度卡，请确认文件已保存。');}
  document.addEventListener('click',async e=>{
    const close=e.target.closest('[data-close]');if(close){close.closest('dialog').close();return;}
    const nav=e.target.closest('[data-step]');if(nav){setCurrent(nav.dataset.step);return;}
    const page=e.target.closest('[data-page]');if(page){imagePage(Number(page.dataset.page));return;}
    const button=e.target.closest('[data-action]');if(!button)return;
    switch(button.dataset.action){
      case 'issue':openIssue();break;
      case 'save-issue':state.issue={code:$('#issue-code').value,step:current().id,retryAt:$('#retry-at').value};C.complete(current(),state,'deferred');save();$('#issue-dialog').close();render();toast('已记录卡点，保留当前步骤。');break;
      case 'issue-page':imagePage(issues[$('#issue-code').value].page);break;
      case 'settings':settings();break;
      case 'library':library();show('#library-dialog');break;
      case 'progress':$('#progress-summary').textContent=`当前：${current().title}。已确认 ${route().filter(s=>C.isDone(s,state)).length} / ${route().length} 步。`;show('#progress-dialog');break;
      case 'copy-step':await copy(prompt(current()));break;
      case 'copy-page':await copy(prompt(current(),true));break;
      case 'copy-gift':await copy(D.links.gift_alipay);break;
      case 'copy-progress':await copy(summary());break;
      case 'handoff':if(C.canHandoff(D.steps,state))await copy(handoff());else toast('请先完成本地资料与真实电脑操作等验收。');break;
      case 'export':exportProgress();break;
      case 'defer':C.complete(current(),state,'deferred');moveAfterDefer(current());toast('已保留为待验证；可以继续独立准备，交接前需返回完成。');break;
      case 'not-applicable':if(current().kind==='browser'){C.complete(current(),state,'na');moveAfterDefer(current());}break;
      case 'reset':if(confirm('清空本浏览器进度？如需保留，请先导出进度卡。')){state=C.fresh();hasSaved=false;save();$('#progress-dialog').close();render();settings();}break;
    }
  });
  $('#copy-again').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#copy-text').value);toast('已复制。');}catch(e){$('#copy-text').focus();$('#copy-text').select();toast('文字已选中，请按电脑或手机的复制操作。');}});
  $('#page-preview').addEventListener('click',()=>imagePage(current().page));
  $('#library-search').addEventListener('input',library);
  $('#issue-code').addEventListener('change',issueHelp);
  $('#settings-form').addEventListener('change',updateSettings);
  $('#settings-form').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,answers={};for(const [k,v] of Object.entries(state.answers)){const el=form.elements.namedItem(k);answers[k]=el.type==='checkbox'?el.checked:el.value;}state=C.changeAnswers(state,answers,D.steps);const next=C.next(D.steps,state);if(next)state.current=next.id;hasSaved=true;save();$('#settings-dialog').close();render();toast('路线已更新，已有独立步骤会保留。');});
  $('#import-file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>100000)throw new Error('进度卡过大。请选择本程序导出的 JSON 文件。');const raw=JSON.parse(await f.text());const imported=C.sanitize(raw,D.steps);if(raw.version!==D.version&&!confirm('进度版本不同。将只保留本首版认识的字段和步骤，其他内容会被忽略。是否继续？'))return;if(!confirm('恢复会替换本浏览器当前记录。您是否已保存需要保留的原进度？'))return;state=imported;hasSaved=true;save();$('#progress-dialog').close();render();toast('已恢复用户进度记录；请核对实际页面后继续。');}catch(err){toast(err.message||'无法读取进度文件。');}finally{e.target.value='';}});
  render();if(!hasSaved)settings();
})();
