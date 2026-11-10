(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbyTqppyZh_NuLk32pw5cOcv91kg2yIs7IPtyFHzWznhjDYTYBXPn5F-ICmA_A6OATIj/exec';
  var STORAGE = 'siriai-and2ble-referrer-identity-v2';
  var params = new URLSearchParams(location.search), lang = params.get('lang') === 'ko' ? 'ko' : 'ja';
  var inviteOwner = /^[a-f0-9]{32}$/.test(params.get('from') || '') ? params.get('from') : '';
  var inviteReferral = /^[a-f0-9]{32}$/.test(params.get('ref') || '') ? params.get('ref') : '';
  var app = document.getElementById('app'), profile = null, busy = false, toastTimer;
  var T = {
  "ja": {
    "errors": {
      "ALREADY_REGISTERED": "このお友達はすでにキャンペーンに登録済みのため、紹介対象になりません。",
      "ALREADY_REFERRED": "このアカウントはすでに紹介の受付があります。確認が必要な場合は運営へお問い合わせください。",
      "SELF_REFERRAL": "ご自身のアカウントは紹介できません。お友達のIDを入力してください。",
      "INVALID_HANDLE": "アカウントIDを確認し、TikTok・Instagramのどちらか1つ以上を入力してください。",
      "INVALID_NAME": "紹介者のお名前（活動名）を入力してください。",
      "INVALID_EMAIL": "メールアドレスをご確認ください。",
      "OWNER_EXISTS": "この情報で紹介者の登録があります。登録したブラウザから開くか、運営へお問い合わせください。",
      "ACCESS_DENIED": "紹介状況を確認できませんでした。運営へお問い合わせください。",
      "INVALID_INVITE": "この紹介リンクを確認できませんでした。送り主または運営へお問い合わせください。",
      "SETUP_REQUIRED": "紹介の受付を準備しています。しばらくしてからお試しください。",
      "NETWORK": "受付結果を確認できませんでした。同じ情報を再入力すると、重複登録せずリンクを確認できます。",
      "DEFAULT": "受付状況を確認できませんでした。時間をおいてお試しいただくか、運営へお問い合わせください。"
    },
    "contact": "登録状況や紹介の確認は、運営へのお問い合わせでもご案内します。",
    "contactLink": "メールで問い合わせる",
    "rulesHeading": "紹介リワードの条件を見る",
    "rules": [
      "新しく申し込むお友達が対象です。すでに登録済みのお友達は対象になりません。",
      "お友達の登録後、ガイドに沿った参加まで認定された場合に、紹介者へ1人あたり2,000円相当を加算します。",
      "TikTok・Instagramの両方に参加しても、紹介リワードは同じ友達1人につき1回です。",
      "同じ友達に複数の紹介がある場合は、最初に受け付けた紹介を確認します。自分自身の紹介は対象外です。",
      "紹介された方への紹介特典の上乗せはありません。通常の参加リワードは別途キャンペーンの条件に従います。"
    ],
    "notice": "振付ガイドが更新されました。9秒・16秒付近の親指の動きは、1回だけ折る形に変更してください。",
    "guide": "最新ガイドを確認",
    "inviteTitle": "お友達からのご紹介です。",
    "title": "友達と、もう一度踊ろう。",
    "inviteLead": "AND2BLE「French Kissing」チャレンジに、一緒に参加しませんか。",
    "lead": "AND2BLE「French Kissing」に、まだ申し込んでいないお友達をご紹介ください。",
    "per": "参加認定された友達1人につき",
    "reward": "+2,000円相当",
    "timing": "お友達の新規登録と参加が認定された後、あなたの最終リワードに加算します。",
    "name": "お名前（活動名）",
    "friendName": "お友達のお名前（活動名）",
    "optional": "任意",
    "email": "メールアドレス",
    "instagram": "Instagram ID",
    "tiktok": "TikTok ID",
    "handleHelp": "TikTok・Instagramのどちらか1つ以上を入力してください。@付きのIDやプロフィールURLも使えます。",
    "steps": [
      "紹介者",
      "友達の情報",
      "リンクを送る"
    ],
    "platformLabel": "あなたのSNS",
    "ownerHandle": "あなたのSNS ID",
    "ownerHandleHelp": "Instagram・TikTokのうち、ご本人のアカウントを1つ入力してください。",
    "friendPrivacy": "運営から参加のご案内をDM・メールでお送りできるよう、連絡できるアカウントを入力してください。メールは任意です。",
    "inviteButton": "登録してキャンペーン申し込みへ",
    "friendButton": "この友達を紹介する",
    "ownerButton": "友達の情報を入力する",
    "ownerHeading": "あなたのアカウントを入力",
    "ownerIntro": "紹介リワードの受け取り先となる、ご本人のSNSアカウントを入力してください。",
    "ownerIdentity": "紹介者",
    "changeOwner": "アカウントを変更",
    "friendHeading": "紹介する友達の情報を入力",
    "friendIntro": "お友達がキャンペーンに申し込む前に登録してください。次の画面で、このお友達に送るリンクが表示されます。",
    "shareHeading": "このリンクを、今紹介した友達へ",
    "shareIntro": "あなたとお友達の紹介情報を紐づけました。お友達は下のリンクからキャンペーンにお申し込みいただけます。",
    "shareLabel": "友達に送る参加リンク",
    "copy": "リンクをコピー",
    "tracking": "お友達の登録状況は自動で照合します。実際の参加まで認定されると、最終リワードに反映します。確認が必要な場合は運営へお問い合わせください。",
    "another": "別の友達を紹介する",
    "inviteHeading": "キャンペーンの参加申し込みへ",
    "inviteBody": "お友達が紹介情報を登録済みです。お友達に伝えたSNSアカウントと同じアカウントでお申し込みください。",
    "apply": "キャンペーンに申し込む",
    "inviteNoBonus": "紹介された方への追加特典はありません。通常の参加リワードは、キャンペーンの条件に沿ってお受け取りいただけます。",
    "copied": "紹介リンクをコピーしました。",
    "copyFallback": "リンクを選択しました。コピーしてください。",
    "saving": "確認しています…",
    "titleParts": [
      "友達と、",
      "もう一度踊ろう。"
    ]
  },
  "ko": {
    "errors": {
      "ALREADY_REGISTERED": "이미 캠페인에 등록한 친구여서 추천 대상으로 인정되지 않습니다.",
      "ALREADY_REFERRED": "이미 추천이 접수된 계정입니다. 확인이 필요하면 운영팀에 문의해 주세요.",
      "SELF_REFERRAL": "본인 계정은 추천할 수 없습니다. 친구의 계정을 입력해 주세요.",
      "INVALID_HANDLE": "아이디를 확인하고 TikTok·Instagram 중 하나 이상 입력해 주세요.",
      "INVALID_NAME": "추천인 이름(활동명)을 입력해 주세요.",
      "INVALID_EMAIL": "이메일 주소를 확인해 주세요.",
      "OWNER_EXISTS": "이 정보로 등록된 추천인 내역이 있습니다. 등록한 브라우저로 열거나 운영팀에 문의해 주세요.",
      "ACCESS_DENIED": "추천 현황을 확인하지 못했습니다. 운영팀에 문의해 주세요.",
      "INVALID_INVITE": "이 추천 링크를 확인하지 못했습니다. 친구나 운영팀에 문의해 주세요.",
      "SETUP_REQUIRED": "친구추천 접수를 준비하고 있습니다. 잠시 후 다시 확인해 주세요.",
      "NETWORK": "접수 결과를 확인하지 못했습니다. 같은 정보를 다시 입력하면 중복 저장 없이 링크를 확인할 수 있습니다.",
      "DEFAULT": "접수 여부를 확인하지 못했습니다. 잠시 후 다시 확인하거나 운영팀에 문의해 주세요."
    },
    "contact": "친구 등록 여부나 추천 내역은 운영팀에 문의해 확인하셔도 됩니다.",
    "contactLink": "이메일로 문의하기",
    "rulesHeading": "추천 보상 조건 보기",
    "rules": [
      "새로 신청하는 친구가 대상입니다. 이미 등록한 친구는 인정되지 않습니다.",
      "친구의 등록 후 가이드에 맞는 실제 참여까지 인정되면, 추천인에게 친구 1명당 2,000엔 상당을 추가합니다.",
      "친구가 TikTok·Instagram 양쪽에 참여해도 추천 보상은 같은 친구 1명당 한 번입니다.",
      "동일한 친구를 여러 사람이 추천하면 먼저 접수된 추천을 확인합니다. 본인 추천은 인정되지 않습니다.",
      "추천받은 친구에게 추가 추천 보상은 없습니다. 기본 참여 리워드는 캠페인 조건을 따릅니다."
    ],
    "notice": "안무 가이드가 변경됐습니다. 9초·16초 부근의 엄지 동작은 한 번만 접는 것으로 바꿔 주세요.",
    "guide": "최신 가이드 확인",
    "inviteTitle": "친구의 소개로 오셨군요.",
    "title": "친구와 함께, 한 번 더 춤춰요.",
    "inviteLead": "AND2BLE 「French Kissing」 챌린지에 함께해 주세요.",
    "lead": "AND2BLE 「French Kissing」에 아직 신청하지 않은 친구를 소개해 주세요.",
    "per": "참여가 인정된 친구 1명마다",
    "reward": "+2,000엔 상당",
    "timing": "친구의 신규 등록과 참여가 인정되면, 추천인의 최종 리워드에 더해 드립니다.",
    "name": "이름 (활동명)",
    "friendName": "친구 이름 (활동명)",
    "optional": "선택",
    "email": "이메일 주소",
    "instagram": "Instagram 아이디",
    "tiktok": "TikTok 아이디",
    "handleHelp": "TikTok·Instagram 중 하나 이상 입력해 주세요. @를 붙인 아이디나 프로필 링크도 사용할 수 있어요.",
    "steps": [
      "추천인",
      "친구 정보",
      "링크 전달"
    ],
    "platformLabel": "내 SNS",
    "ownerHandle": "내 SNS 아이디",
    "ownerHandleHelp": "Instagram·TikTok 중 본인 계정 하나만 입력해 주세요.",
    "friendPrivacy": "운영팀에서 참여 안내 DM·이메일을 보낼 수 있도록 연락 가능한 계정을 입력해 주세요. 이메일은 선택 사항입니다.",
    "inviteButton": "등록하고 캠페인 신청하기",
    "friendButton": "이 친구 추천하기",
    "ownerButton": "친구 소개하기",
    "ownerHeading": "추천인 계정을 입력해 주세요",
    "ownerIntro": "추천 보상을 받을 본인의 SNS 계정을 입력해 주세요.",
    "ownerIdentity": "추천인",
    "changeOwner": "계정 변경",
    "friendHeading": "소개할 친구를 입력해 주세요",
    "friendIntro": "친구가 캠페인에 신청하기 전에 등록해 주세요. 다음 화면에서 이 친구에게 보낼 링크를 받을 수 있어요.",
    "shareHeading": "이 링크를 친구에게 보내 주세요",
    "shareIntro": "추천인과 친구 정보가 연결됐습니다. 친구는 아래 링크에서 캠페인 참여 신청을 하면 됩니다.",
    "shareLabel": "친구에게 보낼 참여 링크",
    "copy": "링크 복사",
    "tracking": "친구의 등록 여부는 자동으로 대조됩니다. 실제 참여까지 인정되면 최종 리워드에 반영되며, 확인이 필요하면 운영팀에 문의해 주세요.",
    "another": "다른 친구 소개하기",
    "inviteHeading": "캠페인 참여 신청을 진행해 주세요",
    "inviteBody": "친구가 추천 정보를 등록해 두었습니다. 친구에게 알려준 SNS 계정과 같은 계정으로 신청해 주세요.",
    "apply": "캠페인 참여 신청하기",
    "inviteNoBonus": "추천받은 친구에게 추가 추천 보상은 없습니다. 기본 참여 리워드는 캠페인 조건에 따라 지급됩니다.",
    "copied": "친구추천 링크를 복사했습니다.",
    "copyFallback": "링크를 선택했습니다. 직접 복사해 주세요.",
    "saving": "확인하고 있습니다…",
    "titleParts": [
      "친구와 함께,",
      "한 번 더 춤춰요."
    ]
  }
}[lang];
  document.querySelector('.brand').href = applyUrl();
  document.documentElement.lang = lang;
  document.title = 'AND2BLE ' + (lang === 'ko' ? '친구추천' : '友達紹介') + ' | SIRIAI';
  ['ja', 'ko'].forEach(function (code) { var url = new URL(location.href); url.searchParams.set('lang', code); document.getElementById('lang-' + code).href = url.href; if (code === lang) document.getElementById('lang-' + code).setAttribute('aria-current', 'page'); });
  function escape(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function randomId() { return crypto.randomUUID().replace(/-/g, ''); }
  function message(code) { return T.errors[code] || T.errors.DEFAULT; }
  function guideUrl() { return 'https://and2ble-hub.vercel.app/guideline/guide-' + lang + '.html'; }
  function applyUrl() { return 'https://and2ble-hub.vercel.app/guideline/' + lang + '.html'; }
  function support() { return '<p class="support">' + T.contact + ' <a href="mailto:sbsiriai@gmail.com">' + T.contactLink + '</a></p>'; }
  function rules() { return '<details class="panel terms"><summary>' + T.rulesHeading + '</summary><ul class="rules">' + T.rules.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul><p class="notice">' + T.notice + ' <a href="' + guideUrl() + '" target="_blank" rel="noopener noreferrer">' + T.guide + '</a></p></details>'; }
  function hero(invite) { return '<section class="hero"><p class="campaign">AND2BLE · French Kissing</p><h1>' + (invite ? escape(T.inviteTitle) : T.titleParts.map(function (part) { return '<span class="title-phrase">' + escape(part) + '</span>'; }).join(' ')) + '</h1><p class="lead">' + (invite ? T.inviteLead : T.lead) + '</p>' + (invite ? '' : '<div class="reward-line"><span>' + T.per + '</span><strong>' + T.reward + '</strong></div><p class="small">' + T.timing + '</p>') + '</section>'; }
  function fields(invited) {
    return '<div class="fields"><label><span class="field-title">' + (invited ? T.name : T.friendName) + ' <small>(' + T.optional + ')</small></span><input name="name" maxlength="80" autocomplete="off"></label><label><span class="field-title">' + T.email + ' <small>(' + T.optional + ')</small></span><input name="email" type="email" maxlength="254" autocomplete="off"></label><label><span class="field-title">' + T.instagram + '</span><input name="instagram" autocapitalize="none" spellcheck="false" maxlength="200" placeholder="@instagram_id" autocomplete="off"></label><label><span class="field-title">' + T.tiktok + '</span><input name="tiktok" autocapitalize="none" spellcheck="false" maxlength="200" placeholder="@tiktok_id" autocomplete="off"></label></div><p class="helper">' + T.handleHelp + '</p>';
  }

  function steps(current) { return '<ol class="flow-steps" aria-label="' + (lang === 'ko' ? '친구추천 순서' : '紹介の手順') + '">' + T.steps.map(function (text, i) { return '<li' + (i === current ? ' aria-current="step"' : '') + '><span class="step-number">' + (i + 1) + '</span><span class="step-label">' + text + '</span></li>'; }).join('') + '</ol>'; }
  function render(content, step, invited) { app.innerHTML = (invited || step === 0 ? hero(invited) : '<p class="campaign flow-campaign">AND2BLE · French Kissing</p>') + (invited ? '' : steps(step)) + content + rules(); app.setAttribute('aria-busy', 'false'); }
  function focusHeading() { document.getElementById('screen-heading').focus(); }
  function ownerFields() {
    return '<fieldset class="platform-choice"><legend>' + T.platformLabel + '</legend><label><input type="radio" name="platform" value="instagram" checked> Instagram</label><label><input type="radio" name="platform" value="tiktok"> TikTok</label></fieldset><label for="owner-handle">' + T.ownerHandle + '<input id="owner-handle" name="handle" required autocapitalize="none" spellcheck="false" maxlength="200" placeholder="@account_id" autocomplete="off" aria-describedby="owner-handle-help"></label><p class="helper" id="owner-handle-help">' + T.ownerHandleHelp + '</p>';
  }
  function form(id, friend, invited) { return '<form id="' + id + '">' + (friend ? fields(invited) + '<p class="helper">' + T.friendPrivacy + '</p>' : ownerFields()) + '<p class="error" role="alert" hidden></p><button class="button primary full" type="submit">' + (invited ? T.inviteButton : friend ? T.friendButton : T.ownerButton) + '</button></form>'; }
  function registration() {
    render('<section class="panel"><h2 id="screen-heading" tabindex="-1">' + T.ownerHeading + '</h2><p class="small">' + T.ownerIntro + '</p>' + form('owner-form', false, false) + support() + '</section>', 0, false);
    var ownerForm = document.getElementById('owner-form');
    try { var saved = JSON.parse(localStorage.getItem(STORAGE) || 'null'); if (saved && /^(instagram|tiktok)$/.test(saved.platform)) { ownerForm.querySelector('[value="' + saved.platform + '"]').checked = true; ownerForm.elements.handle.value = saved.handle || ''; } } catch (_) {}
    ownerForm.addEventListener('input', function () { if (!ownerForm.elements.handle.value.trim()) { try { localStorage.removeItem(STORAGE); } catch (_) {} } });
    ownerForm.addEventListener('submit', identifyOwner);
  }
  function friendPage(legacy) {
    var identity = legacy ? '' : '<div class="identity"><span>' + T.ownerIdentity + ': <strong>' + (profile.platform === 'instagram' ? 'Instagram' : 'TikTok') + ' @' + escape(profile.handle) + '</strong></span><button class="text-button" id="change-owner" type="button">' + T.changeOwner + '</button></div>';
    render('<section class="panel">' + identity + '<h2 id="screen-heading" tabindex="-1">' + (legacy ? (lang === 'ko' ? '참여할 계정을 입력해 주세요' : '参加するアカウントを入力') : T.friendHeading) + '</h2><p class="small">' + (legacy ? (lang === 'ko' ? '추천 정보를 연결한 다음 캠페인 신청으로 이동합니다.' : '紹介情報を紐づけてから、キャンペーンの申し込みへ進みます。') : T.friendIntro) + '</p>' + form('friend-form', true, legacy) + support() + '</section>', 1, legacy);
    document.getElementById('friend-form').addEventListener('submit', addFriend);
    var change = document.getElementById('change-owner'); if (change) change.addEventListener('click', function () { try { localStorage.removeItem(STORAGE); } catch (_) {} profile = null; registration(); focusHeading(); });
  }
  function linkPage(referralId, friend) {
    var url = new URL(location.pathname, location.origin); url.searchParams.set('ref', referralId); url.searchParams.set('lang', lang);
    var handles = [friend.instagram ? 'Instagram ' + escape(friend.instagram) : '', friend.tiktok ? 'TikTok ' + escape(friend.tiktok) : ''].filter(Boolean).join(' / ');
    render('<section class="panel done"><span class="success-mark" aria-hidden="true">✓</span><h2 id="screen-heading" tabindex="-1">' + T.shareHeading + '</h2><p>' + T.shareIntro + '</p><p class="small">' + (friend.name ? escape(friend.name) + ' · ' : '') + handles + '</p><div class="share-box"><label for="share-url">' + T.shareLabel + '</label><input class="share-link" id="share-url" readonly value="' + escape(url.href) + '"><button type="button" class="button ink full" id="copy-link">' + T.copy + '</button></div><p class="helper">' + T.tracking + '</p><button class="button full" type="button" id="another">' + T.another + '</button>' + support() + '</section>', 2, false);
    document.getElementById('copy-link').addEventListener('click', copyLink);
    document.getElementById('another').addEventListener('click', function () { friendPage(false); focusHeading(); });
    focusHeading();
  }
  function invitePage() {
    render('<section class="panel"><h2 id="screen-heading" tabindex="-1">' + T.inviteHeading + '</h2><p>' + T.inviteBody + '</p><a class="button primary full" href="' + applyUrl() + '">' + T.apply + '</a><p class="helper">' + T.inviteNoBonus + '</p>' + support() + '</section>', 0, true);
  }
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
  async function identifyOwner(event) {
    event.preventDefault(); var formElement = event.currentTarget; if (busy) return;
    try {
      var input = new FormData(formElement), data = {}, platform = input.get('platform') === 'tiktok' ? 'tiktok' : 'instagram';
      data[platform] = String(input.get('handle') || '').trim(); if (!data[platform]) throw new Error('INVALID_HANDLE');
      setBusy(formElement, true); profile = (await action('identifyOwner', data)).owner;
      try { localStorage.setItem(STORAGE, JSON.stringify({ platform: profile.platform, handle: profile.handle })); } catch (_) {}
      friendPage(false); focusHeading();
    } catch (err) { error(formElement, err); } finally { if (formElement.isConnected) setBusy(formElement, false); else busy = false; }
  }
  async function addFriend(event) {
    event.preventDefault(); var formElement = event.currentTarget; if (busy) return;
    try {
      var data = getValues(formElement); setBusy(formElement, true);
      var result = await action('addFriend', Object.assign({}, data, { ownerId: inviteOwner || profile.id }));
      if (inviteOwner) { invitePage(); focusHeading(); } else linkPage(result.referralId, data);
    } catch (err) { error(formElement, err); } finally { if (formElement.isConnected) setBusy(formElement, false); else busy = false; }
  }
  async function start() {
    try {
      if (inviteReferral || inviteOwner) {
        var args = { action: 'invite' }; if (inviteReferral) args.referralId = inviteReferral; else args.ownerId = inviteOwner;
        var invite = await jsonp(args); if (!invite.ok) throw new Error(invite.code);
        if (inviteReferral) invitePage(); else friendPage(true);
        return;
      }
      registration();
      var ownerForm = document.getElementById('owner-form'), submit = ownerForm.querySelector('[type=submit]'); submit.disabled = true;
      try { var health = await jsonp({ action: 'health' }); if (!health.ok || health.flow !== 'friend-first' || health.referrerEligibilityRequired !== false) throw new Error('SETUP_REQUIRED'); submit.disabled = false; }
      catch (_) { error(ownerForm, new Error('SETUP_REQUIRED')); }
    } catch (err) { render('<section class="panel"><p class="error" role="alert">' + escape(message(err.message)) + '</p>' + support() + '</section>', 0, !!(inviteReferral || inviteOwner)); }
  }
  start();
})();
