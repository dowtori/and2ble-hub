(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbyTqppyZh_NuLk32pw5cOcv91kg2yIs7IPtyFHzWznhjDYTYBXPn5F-ICmA_A6OATIj/exec';
  var STORAGE = 'siriai-and2ble-referrer-v1';
  var params = new URLSearchParams(location.search), lang = params.get('lang') === 'ko' ? 'ko' : 'ja';
  var inviteOwner = /^[a-f0-9]{32}$/.test(params.get('from') || '') ? params.get('from') : '';
  var app = document.getElementById('app'), profile = null, state = null, busy = false, toastTimer;
  var T = {
    ja: {
      title: '友達と、もう一度踊ろう。', lead: 'AND2BLE「French Kissing」に、まだ申し込んでいないお友達をご紹介ください。', per: '参加認定された友達1人につき', reward: '+2,000円相当', timing: 'お友達の新規登録と参加が認定された後、あなたの最終リワードに加算します。',
      ownerHeading: 'まず、あなたの情報を登録', ownerIntro: 'キャンペーン申し込み時のお名前とアカウントを入力してください。どなたのご紹介かと、紹介リワードの確認に使用します。', name: 'お名前（活動名）', email: 'メールアドレス', optionalEmail: 'お友達のメールアドレス', optional: '任意', followers: 'フォロワー1,000人以上', ownerName: '紹介者のお名前（活動名）', ownerIdentity: '紹介者', tiktok: 'TikTok ID', instagram: 'Instagram ID', handleHelp: 'TikTok・Instagramのどちらか1つ以上を入力してください。@付きのIDやプロフィールURLも使えます。', ownerButton: '紹介リンクを作る', saving: '確認しています…',
      shareHeading: 'あなたの紹介リンク', shareIntro: 'このリンクをお友達に送るか、下のフォームでお友達を登録してください。', shareLabel: '友達に送るリンク', copy: 'リンクをコピー', copied: '紹介リンクをコピーしました。', copyFallback: 'リンクを選択しました。コピーしてください。',
      statusHeading: '紹介した友達の状況', registered: '登録済み', approved: '参加認定', added: '追加リワード', people: '人', refresh: '更新', updated: '登録状況は自動で反映されます。参加認定前の人数は、リワードに含まれません。', empty: '紹介した友達はまだいません。リンクを送るか、下のフォームから登録できます。', device: 'このブラウザで紹介状況を確認できます。別の端末での確認や登録情報の修正は、運営へお問い合わせください。',
      friendHeading: '友達を紹介する', friendIntro: 'お友達が申し込む前に、アカウントを登録してください。', friendName: 'お友達のお名前（活動名）', friendButton: 'この友達を紹介する', friendPrivacy: '運営から参加のご案内をDM・メールでお送りできるよう、連絡できるアカウントを入力してください。メールは任意です。',
      inviteTitle: 'お友達からのご紹介です。', inviteLead: 'まず、参加に使うアカウントを登録してください。その後、キャンペーンの申し込みへ進みます。', inviteHeading: 'あなたのアカウント', inviteButton: '登録してキャンペーン申し込みへ', inviteNoBonus: '紹介された方への追加特典はありません。通常の参加リワードは、キャンペーンの条件に沿ってお受け取りいただけます。',
      doneHeading: '紹介の受付ができました。', doneBody: '続けてキャンペーンの参加申し込みをお願いします。紹介登録だけでは、キャンペーンへの参加は確定しません。申し込みにも、今登録したアカウントを使ってください。', apply: 'キャンペーンに申し込む', ownerDone: '友達を登録しました。参加申し込みのリンクを送ってください。', another: '別の友達も紹介する',
      rulesHeading: '紹介リワードの条件', rules: ['新しく申し込むお友達が対象です。すでに登録済みのお友達は対象になりません。','お友達の登録後、ガイドに沿った参加まで認定された場合に、紹介者へ1人あたり2,000円相当を加算します。','TikTok・Instagramの両方に参加しても、紹介リワードは同じ友達1人につき1回です。','同じ友達に複数の紹介がある場合は、最初に受け付けた紹介を確認します。自分自身の紹介は対象外です。','紹介された方への紹介特典の上乗せはありません。通常の参加リワードは別途キャンペーンの条件に従います。'],
      contact: '登録状況や紹介の確認は、運営へのお問い合わせでもご案内します。', contactLink: 'メールで問い合わせる', notice: '振付ガイドが更新されました。9秒・16秒付近の親指の動きは、1回だけ折る形に変更してください。', guide: '最新ガイドを確認',
      statuses: { pending: '登録待ち', registered: '登録済み・参加確認待ち', approved: '参加認定', rejected: '認定対象外', duplicate: '重複紹介・対象外', review: 'アカウント確認中' },
      errors: { ALREADY_REGISTERED: 'このお友達はすでにキャンペーンに登録済みのため、紹介対象になりません。', ALREADY_REFERRED: 'このアカウントはすでに紹介の受付があります。確認が必要な場合は運営へお問い合わせください。', SELF_REFERRAL: 'ご自身のアカウントは紹介できません。お友達のIDを入力してください。', INVALID_HANDLE: 'アカウントIDを確認し、TikTok・Instagramのどちらか1つ以上を入力してください。', INVALID_NAME: '紹介者のお名前（活動名）を入力してください。', INVALID_EMAIL: 'メールアドレスをご確認ください。', OWNER_EXISTS: 'この情報で紹介者の登録があります。登録したブラウザから開くか、運営へお問い合わせください。', ACCESS_DENIED: '紹介状況を確認できませんでした。運営へお問い合わせください。', INVALID_INVITE: 'この紹介リンクを確認できませんでした。送り主または運営へお問い合わせください。', SETUP_REQUIRED: '紹介の受付を準備しています。しばらくしてからお試しください。', NETWORK: '通信を確認できませんでした。再送する前に運営へ受付状況をお問い合わせください。', DEFAULT: '受付状況を確認できませんでした。時間をおいてお試しいただくか、運営へお問い合わせください。' }
    },
    ko: {
      title: '친구와 함께, 한 번 더 춤춰요.', lead: 'AND2BLE 「French Kissing」에 아직 신청하지 않은 친구를 소개해 주세요.', per: '참여가 인정된 친구 1명마다', reward: '+2,000엔 상당', timing: '친구의 신규 등록과 참여가 인정되면, 추천인의 최종 리워드에 더해 드립니다.',
      ownerHeading: '먼저 추천인 정보를 등록해 주세요', ownerIntro: '캠페인 신청 때 사용한 이름과 계정을 입력해 주세요. 이 정보로 추천인과 추천 리워드를 확인합니다.', name: '이름 (활동명)', email: '이메일 주소', optionalEmail: '친구 이메일 주소', optional: '선택', followers: '1,000 팔로워 이상', ownerName: '추천인 이름 (활동명)', ownerIdentity: '추천인', tiktok: 'TikTok 아이디', instagram: 'Instagram 아이디', handleHelp: 'TikTok·Instagram 중 하나 이상 입력해 주세요. @를 붙인 아이디나 프로필 링크도 사용할 수 있어요.', ownerButton: '친구추천 링크 만들기', saving: '확인하고 있습니다…',
      shareHeading: '나의 친구추천 링크', shareIntro: '이 링크를 친구에게 보내거나, 아래 폼에서 친구를 등록해 주세요.', shareLabel: '친구에게 보낼 링크', copy: '링크 복사', copied: '친구추천 링크를 복사했습니다.', copyFallback: '링크를 선택했습니다. 직접 복사해 주세요.',
      statusHeading: '추천한 친구 현황', registered: '등록 완료', approved: '참여 인정', added: '추가 리워드', people: '명', refresh: '새로고침', updated: '등록 여부는 자동으로 집계됩니다. 참여가 인정되기 전에는 리워드에 포함되지 않습니다.', empty: '아직 추천한 친구가 없습니다. 링크를 보내거나 아래 폼에서 등록해 보세요.', device: '이 브라우저에서 추천 현황을 확인할 수 있어요. 다른 기기에서 확인하거나 등록 정보를 바꾸려면 운영팀에 문의해 주세요.',
      friendHeading: '친구 소개하기', friendIntro: '친구가 캠페인에 신청하기 전에 계정을 등록해 주세요.', friendName: '친구 이름 (활동명)', friendButton: '이 친구 추천하기', friendPrivacy: '운영팀에서 참여 안내 DM·이메일을 보낼 수 있도록 연락 가능한 계정을 입력해 주세요. 이메일은 선택 사항입니다.',
      inviteTitle: '친구의 소개로 오셨군요.', inviteLead: '먼저 참여할 계정을 등록한 다음, 캠페인 신청으로 이동해 주세요.', inviteHeading: '내 계정 등록', inviteButton: '등록하고 캠페인 신청하기', inviteNoBonus: '추천받은 친구에게 추가 추천 보상은 없습니다. 기본 참여 리워드는 캠페인 조건에 따라 지급됩니다.',
      doneHeading: '친구추천이 접수됐습니다.', doneBody: '이어서 캠페인 참여 신청을 진행해 주세요. 추천 등록만으로 캠페인 참여가 확정되지는 않습니다. 방금 등록한 계정과 같은 계정으로 신청해 주세요.', apply: '캠페인 참여 신청하기', ownerDone: '친구를 등록했습니다. 친구에게 참여 신청 링크를 보내 주세요.', another: '다른 친구도 소개하기',
      rulesHeading: '추천 리워드 인정 조건', rules: ['새로 신청하는 친구가 대상입니다. 이미 등록한 친구는 인정되지 않습니다.','친구의 등록 후 가이드에 맞는 실제 참여까지 인정되면, 추천인에게 친구 1명당 2,000엔 상당을 추가합니다.','친구가 TikTok·Instagram 양쪽에 참여해도 추천 보상은 같은 친구 1명당 한 번입니다.','동일한 친구를 여러 사람이 추천하면 먼저 접수된 추천을 확인합니다. 본인 추천은 인정되지 않습니다.','추천받은 친구에게 추가 추천 보상은 없습니다. 기본 참여 리워드는 캠페인 조건을 따릅니다.'],
      contact: '친구 등록 여부나 추천 내역은 운영팀에 문의해 확인하셔도 됩니다.', contactLink: '이메일로 문의하기', notice: '안무 가이드가 변경됐습니다. 9초·16초 부근의 엄지 동작은 한 번만 접는 것으로 바꿔 주세요.', guide: '최신 가이드 확인',
      statuses: { pending: '등록 대기', registered: '등록 완료·참여 확인 대기', approved: '참여 인정', rejected: '인정 대상 아님', duplicate: '중복 추천·대상 제외', review: '계정 대조 확인 중' },
      errors: { ALREADY_REGISTERED: '이미 캠페인에 등록한 친구여서 추천 대상으로 인정되지 않습니다.', ALREADY_REFERRED: '이미 추천이 접수된 계정입니다. 확인이 필요하면 운영팀에 문의해 주세요.', SELF_REFERRAL: '본인 계정은 추천할 수 없습니다. 친구의 계정을 입력해 주세요.', INVALID_HANDLE: '아이디를 확인하고 TikTok·Instagram 중 하나 이상 입력해 주세요.', INVALID_NAME: '추천인 이름(활동명)을 입력해 주세요.', INVALID_EMAIL: '이메일 주소를 확인해 주세요.', OWNER_EXISTS: '이 정보로 등록된 추천인 내역이 있습니다. 등록한 브라우저로 열거나 운영팀에 문의해 주세요.', ACCESS_DENIED: '추천 현황을 확인하지 못했습니다. 운영팀에 문의해 주세요.', INVALID_INVITE: '이 추천 링크를 확인하지 못했습니다. 친구나 운영팀에 문의해 주세요.', SETUP_REQUIRED: '친구추천 접수를 준비하고 있습니다. 잠시 후 다시 확인해 주세요.', NETWORK: '통신을 확인하지 못했습니다. 다시 접수하기 전에 운영팀에 접수 여부를 문의해 주세요.', DEFAULT: '접수 여부를 확인하지 못했습니다. 잠시 후 다시 확인하거나 운영팀에 문의해 주세요.' }
    }
  }[lang];
  document.documentElement.lang = lang;
  document.title = 'AND2BLE ' + (lang === 'ko' ? '친구추천' : '友達紹介') + ' | SIRIAI';
  ['ja', 'ko'].forEach(function (code) { var url = new URL(location.href); url.searchParams.set('lang', code); document.getElementById('lang-' + code).href = url.href; if (code === lang) document.getElementById('lang-' + code).setAttribute('aria-current', 'page'); });
  function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function randomId() { return crypto.randomUUID().replace(/-/g, ''); }
  function message(code) { return T.errors[code] || T.errors.DEFAULT; }
  function guideUrl() { return 'https://and2ble-guideline.vercel.app/guide-' + lang + '.html'; }
  function applyUrl() { return 'https://and2ble-guideline.vercel.app/' + lang + '.html'; }
  function shareUrl() { var u = new URL(location.pathname, location.origin); u.searchParams.set('from', profile.ownerId); u.searchParams.set('lang', lang); return u.href; }
  function support() { return '<p class="support">' + T.contact + ' <a href="mailto:sbsiriai@gmail.com">' + T.contactLink + '</a></p>'; }
  function rules() { return '<section class="panel"><h2>' + T.rulesHeading + '</h2><ul class="rules">' + T.rules.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul><p class="notice">' + T.notice + ' <a href="' + guideUrl() + '" target="_blank" rel="noopener noreferrer">' + T.guide + '</a></p>' + support() + '</section>'; }
  function hero(invite) { return '<section class="hero"><p class="campaign">AND2BLE · French Kissing</p><h1>' + (invite ? T.inviteTitle : T.title) + '</h1><p class="lead">' + (invite ? T.inviteLead : T.lead) + '</p>' + (invite ? '<p class="helper">' + T.inviteNoBonus + '</p>' : '<div class="reward-line"><span>' + T.per + '</span><strong>' + T.reward + '</strong></div><p class="small">' + T.timing + '</p>') + '</section>'; }
  function fields(friend, invited) {
    var followerNote = friend ? '' : ' <small>(' + T.followers + ')</small>';
    var nameLabel = !friend ? T.ownerName : invited ? T.name : T.friendName;
    return '<div class="fields"><label><span class="field-title">' + nameLabel + '</span><input name="name" maxlength="80" autocomplete="' + (friend ? 'off' : 'nickname') + '"' + (friend ? '' : ' required') + '></label><label><span class="field-title">' + (friend && !invited ? T.optionalEmail : T.email) + ' <small>(' + T.optional + ')</small></span><input name="email" type="email" maxlength="254" autocomplete="' + (friend ? 'off' : 'email') + '"></label><label><span class="field-title">' + T.instagram + followerNote + '</span><input name="instagram" autocapitalize="none" spellcheck="false" maxlength="200" placeholder="@instagram_id" autocomplete="off"></label><label><span class="field-title">' + T.tiktok + followerNote + '</span><input name="tiktok" autocapitalize="none" spellcheck="false" maxlength="200" placeholder="@tiktok_id" autocomplete="off"></label></div><p class="helper">' + T.handleHelp + '</p>';
  }

  function form(id, friend, invited) { return '<form id="' + id + '">' + fields(friend, invited) + (friend ? '<p class="helper">' + T.friendPrivacy + '</p>' : '') + '<p class="error" role="alert" hidden></p><button class="button primary full" type="submit">' + (invited ? T.inviteButton : friend ? T.friendButton : T.ownerButton) + '</button></form>'; }
  function registration() { app.innerHTML = hero(false) + '<section class="panel"><h2>' + T.ownerHeading + '</h2><p class="small">' + T.ownerIntro + '</p>' + form('owner-form', false, false) + '</section>' + rules(); app.setAttribute('aria-busy', 'false'); document.getElementById('owner-form').addEventListener('submit', registerOwner); }
  function shareBlock(link) { return '<div class="share-box"><label for="share-url">' + T.shareLabel + '</label><input class="share-link" id="share-url" readonly value="' + escape(link) + '"><div class="actions"><button type="button" class="button ink" id="copy-link">' + T.copy + '</button></div></div>'; }
  function dashboard(clearDraft) {
    var previousForm = document.getElementById('friend-form'), draft = {}, focusedName = '';
    if (previousForm && !clearDraft) {
      ['name', 'email', 'tiktok', 'instagram'].forEach(function (key) { draft[key] = previousForm.elements[key].value; });
      if (previousForm.contains(document.activeElement)) focusedName = document.activeElement.name || '';
    }
    var s = state.summary;
    var ownerHandles = [state.owner.instagram ? 'Instagram @' + escape(state.owner.instagram) : '', state.owner.tiktok ? 'TikTok @' + escape(state.owner.tiktok) : ''].filter(Boolean).join(' / ');
    var identity = '<p class="small"><strong>' + T.ownerIdentity + ': ' + escape(state.owner.name) + '</strong><br>' + ownerHandles + '</p>';
    app.innerHTML = hero(false) + '<section class="panel"><h2>' + T.shareHeading + '</h2><p class="small">' + T.shareIntro + '</p>' + identity + shareBlock(shareUrl()) + '<p class="helper">' + T.device + '</p></section><section class="panel"><div class="section-head"><h2>' + T.statusHeading + '</h2><button class="button refresh" id="refresh">' + T.refresh + '</button></div><dl class="stats"><div><dt>' + T.registered + '</dt><dd>' + s.registered + '<small>' + T.people + '</small></dd></div><div><dt>' + T.approved + '</dt><dd>' + s.approved + '<small>' + T.people + '</small></dd></div><div class="amount"><dt>' + T.added + '</dt><dd>¥' + s.reward.toLocaleString() + '</dd></div></dl><p class="helper">' + T.updated + '</p><p id="refresh-error" class="error" role="alert" hidden></p>' + (state.friends.length ? '<ul class="friend-list">' + state.friends.map(function (f) { return '<li><div><strong>' + escape(f.name) + '</strong><div class="handles">' + [f.tiktok ? 'TikTok @' + escape(f.tiktok) : '', f.instagram ? 'Instagram @' + escape(f.instagram) : ''].filter(Boolean).join('<br>') + '</div></div><div><span class="status ' + escape(f.status) + '">' + escape(T.statuses[f.status] || T.statuses.review) + '</span>' + (f.reward ? '<span class="friend-reward">+¥' + f.reward.toLocaleString() + '</span>' : '') + '</div></li>'; }).join('') + '</ul>' : '<p class="empty">' + T.empty + '</p>') + '</section><section class="panel"><h2>' + T.friendHeading + '</h2><p class="small">' + T.friendIntro + '</p>' + form('friend-form', true, false) + '</section>' + rules();
    app.setAttribute('aria-busy', 'false'); document.getElementById('copy-link').addEventListener('click', copyLink); document.getElementById('friend-form').addEventListener('submit', addFriend); document.getElementById('refresh').addEventListener('click', function () { refresh(false); });
    var nextForm = document.getElementById('friend-form');
    Object.keys(draft).forEach(function (key) { nextForm.elements[key].value = draft[key]; });
    if (focusedName && nextForm.elements[focusedName]) nextForm.elements[focusedName].focus();
  }
  function friendPage() { app.innerHTML = hero(true) + '<section class="panel"><h2>' + T.inviteHeading + '</h2>' + form('friend-form', true, true) + '</section>' + rules(); app.setAttribute('aria-busy', 'false'); document.getElementById('friend-form').addEventListener('submit', addFriend); }
  function showToast(text) { var el = document.getElementById('toast'); el.textContent = text; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 4000); }
  async function copyLink() { var input = document.getElementById('share-url'); try { await navigator.clipboard.writeText(input.value); showToast(T.copied); } catch (_) { input.focus(); input.select(); showToast(T.copyFallback); } }
  function jsonp(args) {
    return new Promise(function (resolve, reject) {
      var callback = 'siriaiReferral_' + randomId(), script = document.createElement('script'), timer;
      function cleanup() { clearTimeout(timer); script.remove(); delete window[callback]; }
      window[callback] = function (result) { cleanup(); resolve(result); };
      var url = new URL(API); Object.keys(args).forEach(function (key) { url.searchParams.set(key, args[key]); }); url.searchParams.set('callback', callback); url.searchParams.set('_', Date.now());
      script.src = url.href; script.referrerPolicy = 'no-referrer'; script.onerror = function () { cleanup(); reject(new Error('NETWORK')); }; timer = setTimeout(function () { cleanup(); reject(new Error('NETWORK')); }, 16000); document.head.appendChild(script);
    });
  }
  async function action(kind, payload) {
    var requestId = randomId();
    await fetch(API, { method: 'POST', mode: 'no-cors', credentials: 'omit', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({}, payload, { referralAction: kind, requestId: requestId })) });
    for (var i = 0; i < 10; i++) {
      var result = await jsonp({ action: 'result', requestId: requestId });
      if (!result.pending) { if (!result.ok) throw new Error(result.code || 'DEFAULT'); return result.data; }
      await new Promise(function (resolve) { setTimeout(resolve, 800); });
    }
    throw new Error('NETWORK');
  }
  function getValues(formElement) { var data = new FormData(formElement), out = {}; ['name', 'email', 'tiktok', 'instagram'].forEach(function (key) { out[key] = String(data.get(key) || '').trim(); }); if (!out.tiktok && !out.instagram) throw new Error('INVALID_HANDLE'); return out; }
  function setBusy(formElement, value) { busy = value; var b = formElement.querySelector('[type=submit]'); if (!b.dataset.label) b.dataset.label = b.textContent; b.disabled = value; b.textContent = value ? T.saving : b.dataset.label; }
  function error(formElement, err) { var box = formElement.querySelector('.error'); box.textContent = message(err.message); box.hidden = false; if (err.message === 'ALREADY_REGISTERED') window.alert(box.textContent); }
  function persist() { try { localStorage.setItem(STORAGE, JSON.stringify(profile)); return true; } catch (_) { return false; } }
  async function registerOwner(event) {
    event.preventDefault(); var formElement = event.currentTarget; if (busy) return;
    try {
      var data = getValues(formElement); if (!profile) profile = { ownerKey: randomId() + randomId() };
      if (!persist()) throw new Error('DEFAULT');
      setBusy(formElement, true); state = await action('registerOwner', Object.assign({}, data, { ownerKey: profile.ownerKey })); profile.ownerId = state.owner.id; persist(); dashboard();
    } catch (err) { error(formElement, err); } finally { if (formElement.isConnected) setBusy(formElement, false); else busy = false; }
  }
  async function addFriend(event) {
    event.preventDefault(); var formElement = event.currentTarget; if (busy) return;
    try {
      var data = getValues(formElement); setBusy(formElement, true); await action('addFriend', Object.assign({}, data, { ownerId: inviteOwner || profile.ownerId }));
      if (inviteOwner) { app.innerHTML = hero(true) + '<section class="panel done"><span class="success-mark" aria-hidden="true">✓</span><h2 tabindex="-1" id="done-heading">' + T.doneHeading + '</h2><p>' + T.doneBody + '</p><a class="button primary full" href="' + applyUrl() + '">' + T.apply + '</a>' + support() + '</section>'; document.getElementById('done-heading').focus(); }
      else { showToast(T.ownerDone); state = await action('summary', profile); dashboard(true); }
    } catch (err) { error(formElement, err); } finally { if (formElement.isConnected) setBusy(formElement, false); else busy = false; }
  }
  async function refresh(silent) {
    if (busy || !profile || !profile.ownerId) return;
    var active = document.activeElement;
    if (silent && active && active.closest('#friend-form')) return;
    var button = document.getElementById('refresh'); if (button) button.disabled = true;
    try { state = await action('summary', profile); dashboard(); }
    catch (err) { var box = document.getElementById('refresh-error'); if (box && !silent) { box.textContent = message(err.message); box.hidden = false; } }
    finally { if (button && button.isConnected) button.disabled = false; }
  }
  async function start() {
    try {
      if (inviteOwner) { var invite = await jsonp({ action: 'invite', ownerId: inviteOwner }); if (!invite.ok) throw new Error(invite.code); friendPage(); return; }
      try { profile = JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch (_) { profile = null; }
      if (profile && profile.ownerId) { state = await action('summary', profile); dashboard(); }
      else {
        registration();
        var ownerForm = document.getElementById('owner-form');
        var submit = ownerForm.querySelector('[type=submit]'); submit.disabled = true;
        try {
          var health = await jsonp({ action: 'health' });
          if (!health.ok || health.version !== 'and2ble-referral-20261110-1') throw new Error('SETUP_REQUIRED');
          submit.disabled = false;
        } catch (_) { error(ownerForm, new Error('SETUP_REQUIRED')); }
      }
    } catch (err) {
      app.innerHTML = hero(!!inviteOwner) + '<section class="panel"><p class="error" role="alert">' + escape(message(err.message)) + '</p>' + (err.message === 'ACCESS_DENIED' ? '<button class="button" id="restart">' + (lang === 'ko' ? '추천인 등록으로' : '紹介者の登録画面へ') + '</button>' : '') + support() + '</section>'; app.setAttribute('aria-busy', 'false');
      var restart = document.getElementById('restart');
      if (restart) restart.addEventListener('click', function () { try { localStorage.removeItem(STORAGE); } catch (_) {} profile = null; state = null; start(); });
    }
  }
  setInterval(function () { if (!document.hidden && !inviteOwner) refresh(true); }, 60000);
  start();
})();
