const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

// Google service boundaries are replaced in memory; registration and referral handlers run unchanged.
function environment() {
  const counters = { reads: 0 };
  class Range {
    constructor(sheet, row, col, height = 1, width = 1) { Object.assign(this, { sheet, row, col, height, width }); }
    getSheet() { return this.sheet; }
    getValues() { counters.reads++; return Array.from({ length: this.height }, (_, r) => Array.from({ length: this.width }, (_, c) => this.sheet.values[this.row + r - 1]?.[this.col + c - 1] ?? '')); }
    getValue() { return this.getValues()[0][0]; }
    setValues(values) { values.forEach((row, r) => row.forEach((value, c) => { this.sheet.values[this.row + r - 1] ??= []; this.sheet.values[this.row + r - 1][this.col + c - 1] = value; })); return this; }
    setValue(value) { return this.setValues([[value]]); }
    getNotes() { return Array.from({ length: this.height }, (_, r) => Array.from({ length: this.width }, (_, c) => this.sheet.notes[`${this.row + r}:${this.col + c}`] || '')); }
    setNote(value) { this.sheet.notes[`${this.row}:${this.col}`] = value; return this; }
    setDataValidation() { return this; }
    setBackground() { return this; } setFontColor() { return this; } setFontWeight() { return this; } setWrap() { return this; } setVerticalAlignment() { return this; }
  }
  class Sheet {
    constructor(name, id, values = []) { Object.assign(this, { name, id, values, notes: {} }); }
    getName() { return this.name; } getSheetId() { return this.id; }
    getRange(...args) { return new Range(this, ...args); }
    getLastRow() { return this.values.length; }
    getLastColumn() { return Math.max(0, ...this.values.map(r => r.length)); }
    getMaxRows() { return 1000; } getMaxColumns() { return 26; }
    setFrozenRows() {} setColumnWidths() {} insertColumnsAfter() {}
    appendRow(values) { this.values.push(values); }
  }
  const header = ['제출 시각', '언어', '이름', '이메일', '연락처', '참여 방식', 'TikTok', 'Instagram', '업로드 예정일', '기프트카드', '선정여부', '친구추천여부', '신청 페이지'];
  const response = new Sheet('응답이 들어오는 것을 보는 탭', 1002, [header, ['2026-11-09 12:00:00', 'ja', 'Owner', 'owner@example.test', '', 'TikTok', 'referrer', '', '2026-11-12', 'Apple', '선정', '', '기본']]);
  const sheets = [response];
  const spreadsheet = { getSheets: () => sheets, getSheetByName: name => sheets.find(s => s.name === name), insertSheet: name => { const s = new Sheet(name, sheets.length + 2000); sheets.push(s); return s; } };
  const cached = new Map(); let locked = false;
  const cache = { get: key => cached.get(key) || null, put: (key, value) => cached.set(key, value) };
  const ctx = { console, Map, Set, Date, JSON, Array, Object, String, Number,
    SpreadsheetApp: { openById: () => spreadsheet, newDataValidation: () => { const b = { requireValueInList: () => b, setAllowInvalid: () => b, build: () => ({}) }; return b; } },
    LockService: { getScriptLock: () => ({ waitLock: () => { assert.equal(locked, false, 'nested script lock'); locked = true; }, tryLock: () => { if (locked) return false; locked = true; return true; }, releaseLock: () => { locked = false; } }) },
    Utilities: { getUuid: () => crypto.randomUUID(), DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (_, text) => Array.from(crypto.createHash('sha256').update(text).digest()), formatDate: () => '2026-11-10 12:00:00' },
    CacheService: { getScriptCache: () => cache }, Logger: { log: () => {} },
    ContentService: { MimeType: { JSON: 'json', JAVASCRIPT: 'javascript' }, createTextOutput: text => ({ text, setMimeType(type) { this.type = type; return this; } }) }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../backend/generated/Code.gs'), 'utf8'), ctx);
  const post = data => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify({ requestId: crypto.randomBytes(16).toString('hex'), ...data }) } }).text);
  return { ctx, post, response, sheets, spreadsheet, counters };
}

test('existing signup automatically marks both roles in L and keeps K; participation approval adds 2000 once', () => {
  const env = environment(); env.ctx.setupReferrals();
  const ownerKey = 'a'.repeat(64);
  const registered = env.post({ referralAction: 'registerOwner', ownerKey, name: 'Owner', email: 'owner@example.test', tiktok: 'referrer' });
  assert.equal(registered.ok, true);
  const ownerId = registered.data.owner.id;
  const referred = env.post({ referralAction: 'addFriend', ownerId, name: 'Friend', tiktok: '@FRIEND' });
  assert.equal(referred.ok, true);
  const signup = env.post({ lang: 'ja', name: 'Friend', email: 'friend@example.test', platform: 'tiktok', platformLabel: 'TikTok のみ', tiktok: 'friend', postDate: '2026-11-12', giftCard: 'Apple' });
  assert.equal(signup.ok, true);
  assert.equal(env.response.values[1][10], '선정');
  assert.equal(env.response.values[1][11], '초대를 한');
  assert.equal(env.response.values[2][10] ?? '', '');
  assert.equal(env.response.values[2][11], '초대로 들어온');
  assert.match(env.response.notes['3:12'], /referrer/);
  const ledger = env.sheets.find(s => s.name === '친구추천내역');
  assert.equal(ledger.values[1][10], 0);
  ledger.getRange(2, 10).setValue('인정');
  env.ctx.onEdit({ source: env.spreadsheet, range: ledger.getRange(2, 10) });
  assert.equal(ledger.values[1][10], 2000);
  const summary = env.post({ referralAction: 'summary', ownerId, ownerKey });
  assert.equal(summary.data.summary.reward, 2000);
  assert.equal(summary.data.summary.registered, 1);
  assert.equal(summary.data.summary.approved, 1);
  assert.equal(summary.data.friends[0].status, 'approved');
});

test('already registered friends do not create ledger rows, private summaries need the correct key', () => {
  const env = environment(); env.ctx.setupReferrals();
  const registered = env.post({ referralAction: 'registerOwner', ownerKey: 'b'.repeat(64), name: 'Other', email: 'other@example.test', instagram: 'other' });
  const ownerId = registered.data.owner.id;
  const result = env.post({ referralAction: 'addFriend', ownerId, tiktok: 'referrer' });
  assert.equal(result.code, 'ALREADY_REGISTERED');
  assert.equal(env.sheets.find(s => s.name === '친구추천내역').getLastRow(), 1);
  const denied = env.post({ referralAction: 'summary', ownerId, ownerKey: 'c'.repeat(64) });
  assert.deepEqual(denied, { ok: false, code: 'ACCESS_DENIED' });
});

test('private results use opaque request IDs and reject executable JSONP callbacks', () => {
  const env = environment();
  const invalid = env.ctx.doGet({ parameter: { action: 'health', callback: 'alert(1)//' } });
  assert.equal(invalid.type, 'json');
  assert.equal(JSON.parse(invalid.text).code, 'INVALID_CALLBACK');
  const health = env.ctx.doGet({ parameter: { action: 'health', callback: 'siriaiReferral_test' } });
  assert.equal(health.type, 'javascript');
  assert.match(health.text, /^siriaiReferral_test\(/);
});

test('status refresh reads the sheets in batches even with 120 pending referrals', () => {
  const env = environment(); env.ctx.setupReferrals();
  const ownerKey = 'd'.repeat(64);
  const ownerId = env.post({ referralAction: 'registerOwner', ownerKey, name: 'Owner', email: 'owner@example.test', tiktok: 'referrer' }).data.owner.id;
  const ledger = env.sheets.find(s => s.name === '친구추천내역');
  for (let i = 0; i < 120; i++) ledger.appendRow([crypto.randomUUID(), new Date().toISOString(), ownerId, `Friend ${i}`, '', `new_friend_${i}`, '', '등록 대기', '', '대기', 0, '', 'request-' + i]);
  const previousReads = env.counters.reads;
  const result = env.post({ referralAction: 'summary', ownerId, ownerKey });
  assert.equal(result.data.summary.total, 120);
  assert.ok(env.counters.reads - previousReads <= 12, 'refresh must not read one range for every friend');
});
