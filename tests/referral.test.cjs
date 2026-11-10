const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const corePath = path.join(__dirname, '../backend/referral-core.js');
const core = fs.existsSync(corePath) ? require(corePath) : {};
const owner = { id: 'owner', tiktok: 'referrer', instagram: '', email: 'owner@example.test' };
const claim = (extra = {}) => ({ id: 'claim-1', ownerId: 'owner', createdAt: '2026-11-10T04:00:00Z', tiktok: 'friend', instagram: '', approval: '대기', ...extra });
const application = (extra = {}) => ({ row: 7, tiktok: 'friend', instagram: '', ...extra });

test('handles normalize @, case and platform URLs without accepting another website', () => {
  assert.equal(typeof core.normalizeHandle, 'function');
  assert.equal(core.normalizeHandle(' @Friend.Name ', 'instagram'), 'friend.name');
  assert.equal(core.normalizeHandle('https://www.tiktok.com/@Friend_Name/video/123', 'tiktok'), 'friend_name');
  assert.equal(core.normalizeHandle('https://instagram.com/Friend.Name/?igsh=test', 'instagram'), 'friend.name');
  assert.throws(() => core.normalizeHandle('https://evil.example/friend', 'instagram'), /HANDLE/);
  assert.throws(() => core.normalizeHandle('https://instagram.com/reel/123', 'instagram'), /HANDLE/);
});

test('an existing registration on either handle blocks a referral', () => {
  assert.equal(typeof core.checkFriend, 'function');
  assert.equal(core.checkFriend({ tiktok: 'new', instagram: 'existing' }, owner, [application({ tiktok: '', instagram: 'existing' })], []).code, 'ALREADY_REGISTERED');
});

test('self referrals and prior claims are rejected', () => {
  assert.equal(typeof core.checkFriend, 'function');
  assert.equal(core.checkFriend({ tiktok: 'referrer' }, owner, [], []).code, 'SELF_REFERRAL');
  assert.equal(core.checkFriend({ tiktok: 'friend' }, owner, [], [claim()]).code, 'ALREADY_REFERRED');
});

test('registration and participation approval remain separate; selection alone pays nothing', () => {
  assert.equal(typeof core.plan, 'function');
  const result = core.plan([application({ selection: '선정' })], [owner], [claim()]);
  assert.equal(result.referrals[0].status, 'registered');
  assert.equal(result.referrals[0].reward, 0);
  assert.deepEqual(result.summaries.owner, { total: 1, registered: 1, approved: 0, reward: 0 });
});

test('an unregistered friend remains pending even if someone sets approval', () => {
  assert.equal(typeof core.plan, 'function');
  const result = core.plan([], [owner], [claim({ approval: '인정' })]);
  assert.equal(result.referrals[0].status, 'pending');
  assert.equal(result.referrals[0].reward, 0);
});

test('one friend earns 2000 yen once, even with both platforms and duplicate response rows', () => {
  assert.equal(typeof core.plan, 'function');
  const result = core.plan([application({ instagram: 'igfriend' }), application({ row: 8, instagram: 'igfriend' })], [owner], [claim({ instagram: 'igfriend', approval: '인정' })]);
  assert.equal(result.referrals[0].status, 'approved');
  assert.equal(result.referrals[0].reward, 2000);
  assert.deepEqual(result.summaries.owner, { total: 1, registered: 1, approved: 1, reward: 2000 });
  assert.match(result.annotations[7], /추천으로 들어온 사람/);
});

test('two prior claims that later resolve to one friend credit the earliest claim only', () => {
  assert.equal(typeof core.plan, 'function');
  const referrals = [claim({ approval: '인정' }), claim({ id: 'claim-2', createdAt: '2026-11-10T05:00:00Z', tiktok: '', instagram: 'igfriend', approval: '인정' })];
  const result = core.plan([application({ instagram: 'igfriend' })], [owner], referrals);
  assert.deepEqual(result.referrals.map(r => r.reward), [2000, 0]);
  assert.equal(result.referrals[1].status, 'duplicate');
});

test('handles pointing at different registered people require review and cannot earn rewards', () => {
  assert.equal(typeof core.plan, 'function');
  const result = core.plan([application(), application({ row: 8, tiktok: '', instagram: 'another' })], [owner], [claim({ instagram: 'another', approval: '인정' })]);
  assert.equal(result.referrals[0].status, 'review');
  assert.equal(result.referrals[0].reward, 0);
});

test('rejected participation never earns a referral reward', () => {
  assert.equal(typeof core.plan, 'function');
  const result = core.plan([application()], [owner], [claim({ approval: '불인정' })]);
  assert.equal(result.referrals[0].status, 'rejected');
  assert.equal(result.summaries.owner.reward, 0);
});

test('column L preserves manual notes and replaces only the generated referral block', () => {
  assert.equal(typeof core.mergeAnnotation, 'function');
  const old = '담당자 수동 메모\n【친구추천】\n이전 상태\n【/친구추천】';
  const next = core.mergeAnnotation(old, '새 상태');
  assert.equal(next, '담당자 수동 메모\n【친구추천】\n새 상태\n【/친구추천】');
  assert.equal(core.mergeAnnotation(next, ''), '담당자 수동 메모');
});

test('a referrer who is also registered receives their own column L summary', () => {
  assert.equal(typeof core.plan, 'function');
  const result = core.plan([application(), application({ row: 9, tiktok: 'referrer' })], [owner], [claim({ approval: '인정' })]);
  assert.match(result.annotations[9], /추천한 사람/);
  assert.match(result.annotations[9], /2,000/);
});

test('column L uses the existing role labels and supports a person with both roles', () => {
  assert.equal(typeof core.roleLabel, 'function');
  assert.equal(core.roleLabel('추천한 사람 | 요약'), '초대를 한');
  assert.equal(core.roleLabel('추천으로 들어온 사람 | 요약'), '초대로 들어온');
  assert.equal(core.roleLabel('추천한 사람\n추천으로 들어온 사람'), '초대를 한 · 초대로 들어온');
});
