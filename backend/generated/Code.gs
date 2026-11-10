// Built from backend/registration-original.gs, referral-core.js and referral-server.js.
/**
 * AND2BLE French Kissing 신청 폼 → Google 시트 저장용 Apps Script
 *
 * 저장 위치: 아래 SPREADSHEET_ID 시트의 '응답이 들어오는 것을 보는 탭' (gid=1002)
 *   - 기본 모집 페이지(ja.html / ko.html)와 TikTok / Instagram 모집 페이지(ja-tt, ko-tt, ja-ig, ko-ig)
 *     신청이 모두 이 한 탭에 들어온다.
 *   - A~J열: 신청 내용 (기존과 같음). K열 '선정여부' 등 직접 쓰는 칸은 건드리지 않는다.
 *   - 어느 페이지에서 신청했는지는 '신청 페이지' 제목이 붙은 칸에 기본 / TikTok / Instagram 으로 남긴다.
 *     그 칸이 없으면 제목 줄의 맨 오른쪽 빈 칸에 '신청 페이지' 제목을 만들어 쓴다.
 * (https://docs.google.com/spreadsheets/d/1T1i3U-lNK0yE0dv0L_adKKv5OOw5NY-BT8PGSDDyWYU/edit?gid=1002)
 *
 * 기존 Apps Script 를 그대로 쓰는 경우 (웹 앱 주소가 바뀌지 않음)
 * 1. 기존 Apps Script 편집기에서 내용을 이 코드로 통째로 바꾸고 저장한다.
 * 2. [배포] → [배포 관리] → 연필(수정) → 버전: [새 버전] → [배포]
 */

var SPREADSHEET_ID = '1T1i3U-lNK0yE0dv0L_adKKv5OOw5NY-BT8PGSDDyWYU';
var SHEET_GID = 1002; // 모든 신청이 들어올 탭 (주소의 gid 값)
var HEADERS = ['제출 시각', '언어', '이름', '이메일', '연락처', '참여 방식', 'TikTok', 'Instagram', '업로드 예정일', '기프트카드'];
var SOURCE_HEADER = '신청 페이지';
var SOURCE_LABEL = { main: '기본', tt: 'TikTok', ig: 'Instagram' };

// 탭은 gid 로 찾으므로 탭 이름을 바꿔도 된다.
function getTargetSheet_() {
  var sheets = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === SHEET_GID) return sheets[i];
  }
  throw new Error('gid ' + SHEET_GID + ' 탭을 찾을 수 없습니다.');
}

// '신청 페이지' 칸의 열 번호. 없으면 제목 줄 맨 오른쪽 다음 칸에 만든다.
function sourceColumn_(sh) {
  var lastCol = Math.max(sh.getLastColumn(), HEADERS.length);
  var head = sh.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < head.length; i++) {
    if (String(head[i]).trim() === SOURCE_HEADER) return i + 1;
  }
  var col = lastCol + 1;
  sh.getRange(1, col).setValue(SOURCE_HEADER);
  return col;
}

function registrationDoPost_(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var sh = getTargetSheet_();
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sh.setFrozenRows(1);
    }
    var srcCol = sourceColumn_(sh);
    var row = sh.getLastRow() + 1;
    // A~J열만 채운다. (선정여부 등 다른 칸은 그대로 둔다)
    sh.getRange(row, 1, 1, HEADERS.length).setValues([[
      // 스크립트 시간대 설정과 상관없이 항상 한국 시간으로 기록한다.
      Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
      safe(d.lang),
      safe(d.name),
      safe(d.email),
      "'" + String(d.contact || ''), // 전화번호 앞자리 0 이 사라지지 않게 텍스트로 저장
      safe(d.platformLabel || d.platform),
      safe(d.tiktok),
      safe(d.instagram),
      safe(d.postDate),
      safe(d.giftCard)
    ]]);
    // '신청 페이지' 칸에 드롭다운이 걸려 있으면 목록에 없는 값은 거부될 수 있다.
    // 그래도 신청 내용(A~J열)은 이미 저장됐으니, 여기서 실패해도 신청은 성공으로 처리한다.
    try {
      sh.getRange(row, srcCol).setValue(SOURCE_LABEL[d.source] || '기본');
    } catch (labelErr) {
      console.warn('신청 페이지 칸 기록 실패: ' + labelErr);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// 편집기에서 한 번 실행해 보면 권한 허용 + 탭 연결을 미리 확인할 수 있다.
function testTarget() {
  var sh = getTargetSheet_();
  Logger.log('모든 신청이 들어갈 탭: ' + sh.getName() + ' / 신청 페이지 칸: ' + sourceColumn_(sh) + '열');
}

// 수식으로 해석될 수 있는 값(=, +, -, @ 로 시작)은 텍스트로 저장한다.
function safe(v) {
  v = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

var ReferralCore = (function () {
  function normalizeHandle(value, platform) {
    var text = String(value || '').normalize('NFKC').trim().replace(/^'+/, '');
    if (!text) return '';
    if (/^https?:\/\//i.test(text)) {
      var pattern = platform === 'tiktok'
        ? /^https?:\/\/(?:(?:www|m)\.)?tiktok\.com\/@([^/?#]+)(?:[/?#]|$)/i
        : /^https?:\/\/(?:(?:www|m)\.)?instagram\.com\/([^/?#]+)(?:[/?#]|$)/i;
      var match = text.match(pattern);
      if (!match) throw new Error('INVALID_HANDLE');
      text = decodeURIComponent(match[1]);
    } else {
      var displayMatch = text.match(/\(@([a-z0-9_.]+)\)(?:\s*\|\s*(?:TikTok|Instagram))?$/i);
      if (displayMatch) text = displayMatch[1];
    }
    text = text.replace(/^@/, '').toLowerCase();
    var max = platform === 'tiktok' ? 24 : 30;
    if (!/^[a-z0-9_.]+$/.test(text) || text.length > max || (platform === 'instagram' && /^(p|reel|reels|stories|explore|accounts|direct|tv)$/.test(text))) {
      throw new Error('INVALID_HANDLE');
    }
    return text;
  }
  function keys(person) {
    var out = [];
    ['tiktok', 'instagram'].forEach(function (platform) {
      try {
        var handle = normalizeHandle(person[platform], platform);
        if (handle) out.push(platform + ':' + handle);
      } catch (_) { /* Invalid historical values cannot establish identity. */ }
    });
    return out;
  }
  function overlaps(a, b) {
    var other = keys(b);
    return keys(a).some(function (key) { return other.indexOf(key) !== -1; });
  }
  function checkFriend(friend, owner, registrations, claims) {
    if (!keys(friend).length) return { code: 'INVALID_HANDLE' };
    if (overlaps(friend, owner) || (friend.email && String(friend.email).toLowerCase() === String(owner.email || '').toLowerCase())) return { code: 'SELF_REFERRAL' };
    if (registrations.some(function (person) { return overlaps(friend, person); })) return { code: 'ALREADY_REGISTERED' };
    if (claims.some(function (person) { return overlaps(friend, person); })) return { code: 'ALREADY_REFERRED' };
    return { code: 'OK' };
  }
  function mergeAnnotation(previous, next) {
    var manual = String(previous || '').replace(/(?:\n)?【친구추천】[\s\S]*?【\/친구추천】/g, '').trim();
    return [manual, next ? '【친구추천】\n' + next + '\n【/친구추천】' : ''].filter(Boolean).join('\n');
  }
  function roleLabel(annotation) {
    var owner = String(annotation || '').indexOf('추천한 사람') !== -1;
    var friend = String(annotation || '').indexOf('추천으로 들어온 사람') !== -1;
    return owner && friend ? '초대를 한 · 초대로 들어온' : owner ? '초대를 한' : friend ? '초대로 들어온' : '';
  }
  function plan(registrations, owners, claims) {
    var parent = registrations.map(function (_, i) { return i; });
    function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
    var seen = {};
    registrations.forEach(function (person, i) {
      keys(person).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(seen, key)) parent[find(i)] = find(seen[key]);
        else seen[key] = i;
      });
    });
    function matchedGroups(person) {
      return Array.from(new Set(keys(person).filter(function (key) { return Object.prototype.hasOwnProperty.call(seen, key); }).map(function (key) { return find(seen[key]); })));
    }
    var summaries = {}, ownersById = {}, annotations = {}, claimedGroups = {}, processed = {};
    owners.forEach(function (owner) { summaries[owner.id] = { total: 0, registered: 0, approved: 0, reward: 0 }; ownersById[owner.id] = owner; });
    function annotate(row, text) { annotations[row] = annotations[row] ? annotations[row] + '\n' + text : text; }
    claims.map(function (claim, order) { return { claim: claim, order: order }; }).sort(function (a, b) {
      return (Date.parse(a.claim.createdAt) - Date.parse(b.claim.createdAt)) || (a.order - b.order);
    }).forEach(function (entry) {
      var claim = entry.claim, owner = ownersById[claim.ownerId], groups = matchedGroups(claim);
      var item = Object.assign({}, claim, { status: 'pending', reward: 0, rows: [] });
      if (!owner) item.status = 'review';
      else if (overlaps(claim, owner)) item.status = 'rejected';
      else if (groups.length > 1) item.status = 'review';
      else if (groups.length === 1) {
        var group = groups[0];
        item.rows = registrations.filter(function (_, i) { return find(i) === group; }).map(function (person) { return person.row; });
        if (Object.prototype.hasOwnProperty.call(claimedGroups, group)) item.status = 'duplicate';
        else {
          claimedGroups[group] = claim.id;
          item.status = claim.approval === '인정' ? 'approved' : /^(불인정|취소)$/.test(claim.approval || '') ? 'rejected' : 'registered';
          item.reward = item.status === 'approved' ? 2000 : 0;
          var ownerHandle = owner.instagram ? 'Instagram @' + owner.instagram : 'TikTok @' + owner.tiktok;
          item.rows.forEach(function (row) { annotate(row, '추천으로 들어온 사람 | 추천인: ' + ownerHandle + ' | ' + ({ approved: '참여 인정', registered: '등록 완료·참여 확인 대기', rejected: '참여 불인정' }[item.status]) + ' | 추천ID: ' + claim.id); });
        }
      }
      if (owner) {
        var summary = summaries[owner.id]; summary.total++;
        if (['registered', 'approved', 'rejected'].indexOf(item.status) !== -1 && item.rows.length) summary.registered++;
        if (item.status === 'approved') summary.approved++;
        summary.reward += item.reward;
      }
      processed[claim.id] = item;
    });
    owners.forEach(function (owner) {
      var summary = summaries[owner.id];
      if (!summary.total) return;
      var ownerGroups = matchedGroups(owner);
      registrations.forEach(function (person, i) {
        if (ownerGroups.indexOf(find(i)) !== -1) annotate(person.row, '추천한 사람 | 등록 ' + summary.registered + '명 / 참여 인정 ' + summary.approved + '명 | 추가 리워드 ' + summary.reward.toLocaleString('en-US') + '엔 | 추천인ID: ' + owner.id);
      });
    });
    return { referrals: claims.map(function (claim) { return processed[claim.id]; }), summaries: summaries, annotations: annotations };
  }
  return { normalizeHandle: normalizeHandle, keys: keys, checkFriend: checkFriend, mergeAnnotation: mergeAnnotation, roleLabel: roleLabel, plan: plan };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ReferralCore;

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
