const fieldLabels={CREATOR_NAME:'크리에이터 이름',PARTICIPATION_PLAN:'확정 참여 방식',UPLOAD_DATE_JST:'게시 예정일 (일본 시간)',REWARD_AMOUNT_JPY:'확정 리워드 (엔)',GIFT_CARD:'기프트카드 종류',APPROVED_PARTICIPATION_PLAN:'검수 완료한 참여 방식',APPROVED_POST_URLS:'검수 완료한 게시물 URL',REPLY_DEADLINE_JST:'회신 기한 (일본 시간)'};
const mailHost=document.querySelector('#email-workspace');
fieldLabels.FIX_ITEMS='수정 요청 내용';
fieldLabels.UPLOAD_DATE_TIKTOK_JST='TikTok 게시 예정일 (일본 시간)';
fieldLabels.UPLOAD_DATE_INSTAGRAM_JST='Instagram 게시 예정일 (일본 시간)';
let activeMail=EMAIL_TEMPLATES[0],mailValues={};
function saveDownload(content,name,type){const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function mailPlain(html){const doc=new DOMParser().parseFromString(html,'text/html');doc.querySelectorAll('script,style,title').forEach(e=>e.remove());doc.querySelectorAll('br').forEach(e=>e.replaceWith('\n'));doc.querySelectorAll('p,div,tr,h1,h2,h3,li').forEach(e=>e.append('\n'));return doc.body.textContent.replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').trim();}
function setReminderDeadline(){
  const deadline=document.querySelector('#field-UPLOAD_DATE_JST').valueAsDate;
  const field=document.querySelector('#field-REPLY_DEADLINE_JST');
  field.value='';
  if(!deadline)return;
  deadline.setUTCDate(deadline.getUTCDate()+1);
  field.value=deadline.toISOString().split('T')[0]+'T23:59';
}
function composeMail(){return activeMail.html.replace(/\{\{([A-Z_]+)\}\}/g,(s,k)=>{let value=mailValues[k]?.trim();if(!value)return s;if(activeMail.stage==='reply'&&(k==='UPLOAD_DATE_JST'||k==='REPLY_DEADLINE_JST')){
  const [date,time]=value.split('T');
  const dateText=new Intl.DateTimeFormat(activeMail.lang,{dateStyle:'long',timeZone:'UTC'}).format(new Date(date+'T00:00:00Z'));
  value=time?dateText+' '+time:dateText;
}else if(k==='REPLY_DEADLINE_JST')value=value.replace('T',' ');return esc(value).replace(/\n/g,'<br>');});}
function deadlineProblem(){if(activeMail.stage==='reply'||!activeMail.fields.includes('REPLY_DEADLINE_JST'))return '';const d=mailValues.REPLY_DEADLINE_JST||'';if(!d)return '';if(!/^2026-11-\d{2}T\d{2}:\d{2}$/.test(d)||d<'2026-11-05T00:00'||d>'2026-11-18T23:59')return '회신 기한은 11/18 이내로 개별 조정해 주세요. 이후 일정은 운영팀 확인이 필요합니다.';return '';}
function refreshMail(){if(activeMail.stage==='reply')setReminderDeadline();activeMail.fields.forEach(k=>{mailValues[k]=document.querySelector('#field-'+k)?.value||'';});const html=composeMail();document.querySelector('#mail-preview').srcdoc=html;const missing=activeMail.fields.filter(k=>!mailValues[k]?.trim()||/\{\{/.test(mailValues[k]));const problem=deadlineProblem();const review=document.querySelector('#mail-reviewed').checked;const ready=!missing.length&&!problem&&review;document.querySelector('#mail-state').textContent=problem|| (missing.length?'입력 필요: '+missing.map(k=>fieldLabels[k]||k).join(', '):!review?(activeMail.stage==='guide-update'?'공지 내용과 발송 대상을 확인해 주세요.':'개인별 값과 발송 대상을 확인해 주세요.'):'발송용 파일을 만들 수 있습니다. 수신자는 메일 앱에서 확인하세요.');document.querySelectorAll('[data-mail-ready]').forEach(e=>e.disabled=!ready);return {html,ready};}
function revisionOptions(m) {
  if (!m.fixOptions) return '';
  const buttons = m.fixOptions.map((option, index) =>
    `<button type="button" class="button small" data-add-fix="${index}">${esc(option.label)}</button>`
  ).join('');
  return `<div role="group" aria-label="수정 문구 추가"><strong>수정 문구 추가</strong><div class="dm-actions">${buttons}</div></div>`;
}
function renderMail(){mailValues={};const m=activeMail;mailHost.innerHTML=`<div class="mail-editor"><div class="section-heading"><div><span class="chip ${m.lang==='ja'?'green':'amber'}">${m.lang==='ja'?'일본어 · 발송용':'한국어 · 내부 검수용'}</span><h3>${esc(m.title)}</h3></div><a class="button" href="downloads/${m.id}.html" download>템플릿 HTML ↓</a></div><p>${esc(m.note)}</p><label class="mail-label">메일 제목<input id="mail-subject" value="${esc(m.subject)}" readonly></label><button class="button small" data-mail-action="subject">제목 복사</button>${revisionOptions(m)}<div class="mail-fields">${m.fields.map(k=>`<label class="mail-label">${esc(fieldLabels[k]||k)}${['APPROVED_POST_URLS','FIX_ITEMS'].includes(k)?`<textarea id="field-${k}" rows="3" autocomplete="off"></textarea>`:`<input id="field-${k}" type="${k==='REPLY_DEADLINE_JST'?'datetime-local':m.stage==='reply'&&k==='UPLOAD_DATE_JST'?'date':'text'}" autocomplete="off" ${k==='REPLY_DEADLINE_JST'?(m.stage==='reply'?'readonly':'min="2026-11-05T00:00" max="2026-11-18T23:59"'):''} placeholder="${k.startsWith('UPLOAD_DATE_')?'例：2026年11月10日':k==='PARTICIPATION_PLAN'||k==='APPROVED_PARTICIPATION_PLAN'?'例：TikTok / Instagram / TikTok・Instagram':k==='GIFT_CARD'?'Apple / Google Play / 楽天':''}">`}</label>`).join('')}</div><label class="mail-review"><input id="mail-reviewed" type="checkbox"><span>${m.stage==='revision'?'게시물을 검수하고 이 참여자에게 필요한 수정 사항을 확인했습니다.':m.stage==='guide-update'?'최신 가이드의 변경 내용과 공지 대상, 친구추천 보상 조건을 확인했습니다.':m.stage==='hold'?'회신 기한이 지났고, 실제 게시·다른 채널 회신을 확인했으며 운영팀이 보류를 결정했습니다.':m.stage==='closed'?'회신 기한이 지났고 실제 게시와 다른 채널 회신을 확인했으며 운영팀이 명단 제외를 결정했습니다.':m.stage==='completed'?'게시물 검수, 인정 범위, 확정 리워드와 기프트카드를 확인했습니다.':m.stage==='confirmed'?'선정 상태와 개인별 참여 방식·예정일·리워드·기프트카드를 확인했습니다.':m.stage==='reinvite'?'기존 협업자 중 미신청·미회신 대상이며 신청·확정·거절·수신거부·반송 여부와 게시 기간을 확인했습니다.':m.stage==='reply'?'참여 확정 대상이며 게시 예정일·회신 기한과 실제 게시·회신 상태를 확인했습니다.':'기존 참여자 대상의 최신 모집 문안임을 확인했습니다.'}</span></label><p id="mail-state" class="mail-state" role="status"></p><div class="dm-actions"><button class="button accent" data-mail-action="html" data-mail-ready>발송용 HTML ↓</button><button class="button" data-mail-action="rich" data-mail-ready>서식 본문 복사</button><button class="button" data-mail-action="eml" data-mail-ready>메일 초안 EML ↓</button><button class="button" data-mail-action="text" data-mail-ready>텍스트 ↓</button></div><p class="muted">입력값은 저장·전송하지 않습니다. Gmail은 ‘제목 복사 → 서식 본문 복사 → 새 메일에 붙여넣기’로 준비하세요.</p><textarea id="mail-copy-fallback" class="copy-fallback" readonly hidden aria-label="직접 복사할 메일 제목"></textarea></div><div class="mail-preview-wrap"><h3>본문 미리보기</h3><iframe id="mail-preview" title="${esc(m.title)} ${m.lang==='ja'?'일본어':'한국어'} 이메일 미리보기" sandbox="allow-same-origin"></iframe></div>`;
document.querySelectorAll('[data-mail-template]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.mailTemplate===m.id)));refreshMail();}
const stageTitles={'guide-update':'가이드 변경 안내 · 전체 공지',invite:'모집 안내',reinvite:'재참여 제안 리마인드',confirmed:'선정 확정 · 참여 방식별',reply:'선정 후 리마인드 · 회신 기한 안내'};
function mailButtons(entries) {
  return ['ja','ko'].map(lang=>{
    const m=entries.find(entry=>entry.lang===lang);
    const language=lang==='ja'?'일본어':'한국어';
    return '<button class="button small" data-mail-template="'+m.id+'" aria-pressed="false" aria-label="'+esc(m.title)+' '+language+'">'+language+'</button>';
  }).join('');
}
function renderMailStages() {
  const stages=['guide-update','invite','reinvite','confirmed','reply','hold','closed','revision','completed'];
  document.querySelector('#email-templates').innerHTML=stages.map(stage=>{
    const entries=EMAIL_TEMPLATES.filter(m=>m.stage===stage);
    const plans=[...new Set(entries.map(m=>m.plan))];
    const groups=plans.map(plan=>{
      const group=entries.filter(m=>m.plan===plan);
      const actions='<div class="dm-actions">'+mailButtons(group)+'</div>';
      if(plans.length===1)return actions;
      return '<div class="plan-options"><strong>'+esc(group[0].planLabel||'기존 통합 모집')+'</strong>'+actions+'</div>';
    });
    const selectedDmLink = stage==='confirmed' ? '<a class="button small" href="#selected-dm">선정자 안내 DM 열기</a>' : '';
    return '<article class="email-stage"><h3>'+esc(stageTitles[stage]||entries[0].title)+'</h3>'+groups.join('')+selectedDmLink+'</article>';
  }).join('');
}
renderMailStages();
mailHost.addEventListener('click', event => {
  const button = event.target.closest('[data-add-fix]');
  if (!button) return;
  const field = document.querySelector('#field-FIX_ITEMS');
  const text = activeMail.fixOptions[Number(button.dataset.addFix)].text;
  if (!field.value.split('\n').includes(text)) {
    field.value = [field.value.trimEnd(), text].filter(Boolean).join('\n');
    field.dispatchEvent(new Event('input', {bubbles: true}));
  }
  field.focus();
});
document.addEventListener('input',e=>{if(e.target.closest('#email-workspace')&&e.target.id!=='mail-reviewed'){document.querySelector('#mail-reviewed').checked=false;refreshMail();}});
document.addEventListener('change',e=>{if(e.target.id==='mail-reviewed')refreshMail();});
document.addEventListener('click',async e=>{const selected=e.target.closest('[data-mail-template]');if(selected){activeMail=EMAIL_TEMPLATES.find(m=>m.id===selected.dataset.mailTemplate);renderMail();return;}const action=e.target.closest('[data-mail-action]')?.dataset.mailAction;if(!action)return;const subject=activeMail.subject;if(action==='subject'){try{await navigator.clipboard.writeText(subject);notify('제목을 복사했습니다.');}catch{const a=document.querySelector('#mail-copy-fallback');a.hidden=false;a.value=subject;a.select();notify('선택된 제목을 직접 복사해 주세요.');}return;}const {html,ready}=refreshMail();if(!ready)return;const plain=mailPlain(html),id='AND2BLE-'+activeMail.id;if(action==='html')saveDownload(html,id+'.html','text/html;charset=utf-8');if(action==='text')saveDownload(subject+'\n\n'+plain,id+'.txt','text/plain;charset=utf-8');if(action==='rich'){try{const body=new DOMParser().parseFromString(html,'text/html').body.innerHTML;await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([body],{type:'text/html'}),'text/plain':new Blob([plain],{type:'text/plain'})})]);notify('서식 있는 본문을 복사했습니다. Gmail 새 메일 본문에 붙여넣으세요.');}catch{notify('자동 복사가 차단됐습니다. HTML을 내려받아 열고 본문을 선택해 복사하세요.');}}if(action==='eml'){const b64=s=>btoa(Array.from(new TextEncoder().encode(s),b=>String.fromCharCode(b)).join(''));const fold=s=>b64(s).match(/.{1,76}/g).join('\r\n');const boundary='siriai-'+crypto.randomUUID();const subjectChunks=Array.from(subject).reduce((a,c)=>{if(!a.length||new TextEncoder().encode(a[a.length-1]+c).length>36)a.push(c);else a[a.length-1]+=c;return a;},[]).map(s=>'=?UTF-8?B?'+b64(s)+'?=').join('\r\n ');const eml=['X-Unsent: 1','Subject: '+subjectChunks,'MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',fold(plain),'--'+boundary,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',fold(html),'--'+boundary+'--',''].join('\r\n');saveDownload(eml,id+'.eml','message/rfc822');}});
renderMail();

function openAnnouncementFromHash(){if(location.hash!=='#guide-update')return;activeMail=EMAIL_TEMPLATES.find(m=>m.id==='guide-update-ja');renderMail();document.querySelector('#email-workspace').scrollIntoView({block:'start'});}
window.addEventListener('hashchange',openAnnouncementFromHash);openAnnouncementFromHash();
