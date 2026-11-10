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
