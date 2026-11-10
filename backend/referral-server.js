var REFERRAL_VERSION = 'and2ble-referral-20261110-1';
var REFERRER_SHEET = '친구추천인';
var REFERRAL_SHEET = '친구추천내역';
var REFERRER_HEADERS = ['추천인ID', '등록시각', '이름', '이메일', 'TikTok', 'Instagram', '접근키 해시'];
var REFERRAL_HEADERS = ['추천ID', '접수시각', '추천인ID', '친구 이름', '친구 이메일', 'TikTok', 'Instagram', '등록상태 (자동)', '응답 행 (자동)', '참여인정', '추가리워드 엔 (자동)', '확인 메모 (자동)', '요청ID'];
var REFERRAL_LABELS = { pending: '등록 대기', registered: '등록 완료·참여 확인 대기', approved: '참여 인정', rejected: '참여 불인정', duplicate: '중복 추천·보상 제외', review: '계정 대조 확인 필요' };

function referralError_(code) { throw new Error(code); }
function referralId_() { return Utilities.getUuid().replace(/-/g, ''); }
function referralHash_(key) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key).map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}
function referralPerson_(data, requireEmail) {
  var person = {
    name: String(data.name || '').trim().slice(0, 80),
    email: String(data.email || '').trim().toLowerCase().slice(0, 254),
    tiktok: ReferralCore.normalizeHandle(data.tiktok, 'tiktok'),
    instagram: ReferralCore.normalizeHandle(data.instagram, 'instagram')
  };
  if (!person.tiktok && !person.instagram) referralError_('INVALID_HANDLE');
  if ((requireEmail && !person.email) || (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))) referralError_('INVALID_EMAIL');
  if (!person.name) person.name = '@' + (person.instagram || person.tiktok);
  return person;
}
function referralTarget_(ss) {
  var sh = ss.getSheets().filter(function (s) { return s.getSheetId() === SHEET_GID; })[0];
  if (!sh) referralError_('TARGET_NOT_FOUND');
  return sh;
}
function referralRows_(sh, count) {
  if (!sh || sh.getLastRow() < 2) return [];
  if (sh.getLastRow() > 10000) referralError_('CAPACITY_REVIEW');
  return sh.getRange(2, 1, sh.getLastRow() - 1, count).getValues();
}
function referralRegistrations_(ss) {
  return referralRows_(referralTarget_(ss), 10).map(function (row, i) {
    return { row: i + 2, name: String(row[2] || ''), email: String(row[3] || ''), tiktok: String(row[6] || ''), instagram: String(row[7] || '') };
  });
}
function referralTables_(ss) {
  var os = ss.getSheetByName(REFERRER_SHEET), rs = ss.getSheetByName(REFERRAL_SHEET);
  if (!os || !rs) referralError_('SETUP_REQUIRED');
  return {
    ownerSheet: os, referralSheet: rs,
    owners: referralRows_(os, REFERRER_HEADERS.length).filter(function (r) { return r[0]; }).map(function (r) { return { id: String(r[0]), createdAt: String(r[1]), name: String(r[2]), email: String(r[3]), tiktok: String(r[4]), instagram: String(r[5]), keyHash: String(r[6]) }; }),
    referrals: referralRows_(rs, REFERRAL_HEADERS.length).map(function (r, i) { return { row: i + 2, id: String(r[0] || ''), createdAt: String(r[1] || ''), ownerId: String(r[2] || ''), name: String(r[3] || ''), email: String(r[4] || ''), tiktok: String(r[5] || ''), instagram: String(r[6] || ''), storedStatus: String(r[7] || ''), storedRows: String(r[8] || ''), approval: String(r[9] || ''), storedReward: Number(r[10] || 0), storedMemo: String(r[11] || ''), requestId: String(r[12] || '') }; }).filter(function (r) { return r.id; })
  };
}
function referralOwner_(tables, data) {
  if (!/^[a-f0-9]{32,128}$/.test(String(data.ownerKey || ''))) referralError_('ACCESS_DENIED');
  var hash = referralHash_(data.ownerKey);
  var owner = tables.owners.filter(function (o) { return o.id === data.ownerId && o.keyHash === hash; })[0];
  if (!owner) referralError_('ACCESS_DENIED');
  return owner;
}

// Preserve the manual selection column K. Column L stores roles; cell notes store the relationship detail.
function syncReferralState_(ss) {
  var target = referralTarget_(ss), tables = referralTables_(ss), registrations = referralRegistrations_(ss);
  var plan = ReferralCore.plan(registrations, tables.owners, tables.referrals);
  plan.referrals.forEach(function (item) {
    var memo = item.status === 'duplicate' ? '같은 참여자는 최초 접수된 추천 1건만 인정합니다.' : item.status === 'review' ? '입력 계정들이 서로 다른 신청자와 일치합니다. 운영팀 대조가 필요합니다.' : '';
    var sh = tables.referralSheet;
    var state = [REFERRAL_LABELS[item.status], item.rows.join(', ')];
    var old = [item.storedStatus, item.storedRows];
    if (String(old) !== String(state)) sh.getRange(item.row, 8, 1, 2).setValues([state]);
    var amounts = [item.storedReward, item.storedMemo];
    if (Number(amounts[0] || 0) !== item.reward || String(amounts[1] || '') !== memo) sh.getRange(item.row, 11, 1, 2).setValues([[item.reward, memo]]);
  });
  if (target.getLastRow() > 1) {
    var cells = target.getRange(2, 12, target.getLastRow() - 1, 1), values = cells.getValues(), notes = cells.getNotes();
    registrations.forEach(function (person, i) {
      var annotation = plan.annotations[person.row] || '';
      var hasGenerated = String(notes[i][0] || '').indexOf('【친구추천】') !== -1;
      if (!annotation && !hasGenerated) return;
      var cell = target.getRange(person.row, 12), note = ReferralCore.mergeAnnotation(notes[i][0], annotation), value = ReferralCore.roleLabel(annotation);
      if (note !== notes[i][0]) cell.setNote(note);
      if (value !== String(values[i][0] || '')) cell.setValue(value);
    });
  }
  return { tables: tables, plan: plan };
}
function syncReferrals() {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try { return syncReferralState_(SpreadsheetApp.openById(SPREADSHEET_ID)); }
  finally { lock.releaseLock(); }
}
function onEdit(e) {
  if (!e || !e.source || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getSheetId() !== SHEET_GID && sh.getName() !== REFERRAL_SHEET) return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try { syncReferralState_(e.source); } catch (err) { console.warn('추천 대조: ' + err); }
  finally { lock.releaseLock(); }
}
function setupReferrals() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), target = referralTarget_(ss);
  if (target.getMaxColumns() < 12) target.insertColumnsAfter(target.getMaxColumns(), 12 - target.getMaxColumns());
  var heading = String(target.getRange(1, 12).getValue() || '');
  if (heading && !/친구추천|추천여부/.test(heading)) referralError_('COLUMN_L_ALREADY_IN_USE');
  if (!heading) target.getRange(1, 12).setValue('친구추천여부');
  target.getRange(2, 12, target.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['초대를 한', '초대로 들어온', '초대를 한 · 초대로 들어온'], true).setAllowInvalid(false).build());
  [[REFERRER_SHEET, REFERRER_HEADERS], [REFERRAL_SHEET, REFERRAL_HEADERS]].forEach(function (spec) {
    var sh = ss.getSheetByName(spec[0]);
    if (!sh) {
      sh = ss.insertSheet(spec[0]);
      sh.getRange(1, 1, 1, spec[1].length).setValues([spec[1]]).setBackground('#171310').setFontColor('#ffffff').setFontWeight('bold');
      sh.setFrozenRows(1); sh.setColumnWidths(1, spec[1].length, 150);
      sh.getRange(2, 1, sh.getMaxRows() - 1, spec[1].length).setWrap(true).setVerticalAlignment('top');
    } else if (String(sh.getRange(1, 1, 1, spec[1].length).getValues()[0]) !== String(spec[1])) referralError_('REFERRAL_SCHEMA_MISMATCH');
    if (spec[0] === REFERRAL_SHEET) {
      sh.getRange(2, 10, sh.getMaxRows() - 1, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['대기', '인정', '불인정', '취소'], true).setAllowInvalid(false).build());
      sh.getRange(1, 10).setNote('게시물 검수까지 완료한 친구만 인정으로 변경합니다. 선정 여부만으로는 인정하지 않습니다.');
    }
  });
  syncReferralState_(ss);
  Logger.log('친구추천 준비 완료. L열 역할 표시 / 친구추천내역 J열 참여인정 / 1인당 2,000엔.');
}
function referralSummary_(owner, state) {
  return { owner: { id: owner.id, name: owner.name, tiktok: owner.tiktok, instagram: owner.instagram }, summary: state.plan.summaries[owner.id] || { total: 0, registered: 0, approved: 0, reward: 0 }, friends: state.plan.referrals.filter(function (r) { return r.ownerId === owner.id; }).map(function (r) { return { id: r.id, name: r.name, tiktok: r.tiktok, instagram: r.instagram, status: r.status, reward: r.reward }; }).slice(-100).reverse() };
}
function referralAction_(data) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID), tables = referralTables_(ss), owner;
  if (data.referralAction === 'registerOwner') {
    if (!/^[a-f0-9]{32,128}$/.test(String(data.ownerKey || ''))) referralError_('INVALID_REQUEST');
    var person = referralPerson_(data, true), hash = referralHash_(data.ownerKey);
    owner = tables.owners.filter(function (o) { return o.keyHash === hash; })[0];
    if (!owner) {
      if (tables.owners.some(function (o) { return o.email === person.email || ReferralCore.keys(o).some(function (k) { return ReferralCore.keys(person).indexOf(k) !== -1; }); })) referralError_('OWNER_EXISTS');
      if (tables.owners.length >= 2000) referralError_('CAPACITY_REVIEW');
      owner = Object.assign({}, person, { id: referralId_(), createdAt: new Date().toISOString(), keyHash: hash });
      tables.ownerSheet.appendRow([owner.id, owner.createdAt, safe(owner.name), safe(owner.email), safe(owner.tiktok), safe(owner.instagram), owner.keyHash]);
    }
    return referralSummary_(owner, syncReferralState_(ss));
  }
  if (data.referralAction === 'summary') {
    owner = referralOwner_(tables, data);
    return referralSummary_(owner, syncReferralState_(ss));
  }
  if (data.referralAction === 'addFriend') {
    owner = tables.owners.filter(function (o) { return o.id === data.ownerId; })[0];
    if (!owner) referralError_('INVALID_INVITE');
    var existing = tables.referrals.filter(function (r) { return r.requestId === data.requestId; })[0];
    if (existing) return { referralId: existing.id, alreadySaved: true };
    var friend = referralPerson_(data, false);
    var check = ReferralCore.checkFriend(friend, owner, referralRegistrations_(ss), tables.referrals);
    if (check.code !== 'OK') referralError_(check.code);
    var id = referralId_();
    tables.referralSheet.appendRow([id, new Date().toISOString(), owner.id, safe(friend.name), safe(friend.email), safe(friend.tiktok), safe(friend.instagram), REFERRAL_LABELS.pending, '', '대기', 0, '', data.requestId]);
    syncReferralState_(ss);
    return { referralId: id };
  }
  referralError_('INVALID_REQUEST');
}
function doPost(e) {
  var data;
  try {
    if (!e || !e.postData || String(e.postData.contents || '').length > 16000) return json({ ok: false, code: 'INVALID_REQUEST' });
    data = JSON.parse(e.postData.contents);
  } catch (_) { return json({ ok: false, code: 'INVALID_REQUEST' }); }
  if (!data.referralAction) {
    var result = registrationDoPost_(e);
    try { syncReferrals(); } catch (err) { console.warn('신청 저장 후 추천 대조: ' + err); }
    return result;
  }
  if (!/^[a-f0-9]{32}$/.test(String(data.requestId || ''))) return json({ ok: false, code: 'INVALID_REQUEST' });
  var cache = CacheService.getScriptCache(), key = 'referral-result:' + data.requestId;
  var lock = LockService.getScriptLock(); lock.waitLock(15000);
  try {
    var previous = cache.get(key);
    if (previous) return json(JSON.parse(previous));
    var response;
    try { response = { ok: true, data: referralAction_(data) }; }
    catch (err) {
      var code = String(err.message || err);
      if (!/^(INVALID_[A-Z_]+|ALREADY_REGISTERED|ALREADY_REFERRED|SELF_REFERRAL|OWNER_EXISTS|ACCESS_DENIED|SETUP_REQUIRED|CAPACITY_REVIEW)$/.test(code)) { console.warn('친구추천 처리: ' + err); code = 'SERVER_ERROR'; }
      response = { ok: false, code: code };
    }
    cache.put(key, JSON.stringify(response), 600);
    return json(response);
  } finally { lock.releaseLock(); }
}
function doGet(e) {
  var p = (e && e.parameter) || {}, result;
  try {
    if (p.action === 'health') result = { ok: true, version: REFERRAL_VERSION, rewardPerFriend: 2000 };
    else if (p.action === 'result' && /^[a-f0-9]{32}$/.test(String(p.requestId || ''))) {
      var savedResult = CacheService.getScriptCache().get('referral-result:' + p.requestId);
      result = savedResult ? JSON.parse(savedResult) : { pending: true };
    } else if (p.action === 'invite' && /^[a-f0-9]{32}$/.test(String(p.ownerId || ''))) {
      var tables = referralTables_(SpreadsheetApp.openById(SPREADSHEET_ID));
      var owner = tables.owners.filter(function (o) { return o.id === p.ownerId; })[0];
      result = owner ? { ok: true, data: { ownerId: owner.id } } : { ok: false, code: 'INVALID_INVITE' };
    } else result = { ok: false, code: 'INVALID_REQUEST' };
  } catch (err) { result = { ok: false, code: 'SERVER_ERROR' }; }
  if (p.callback) {
    if (!/^siriaiReferral_[a-zA-Z0-9_]{1,100}$/.test(p.callback)) return json({ ok: false, code: 'INVALID_CALLBACK' });
    return ContentService.createTextOutput(p.callback + '(' + JSON.stringify(result).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029') + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json(result);
}
