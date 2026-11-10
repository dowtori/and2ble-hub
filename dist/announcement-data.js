// Shared announcement content for the hub preview and downloadable email files.
const ANNOUNCEMENT_COPY = {
  ja: {
    subject: '【SIRIAI】AND2BLE｜振付ガイド更新と友達紹介のご案内',
    heading: '振付ガイドの更新と、友達紹介のお知らせ',
    greeting: '皆さま、こんにちは。SIRIAI（シリアイ）キャンペーン運営チームです。',
    intro: 'AND2BLE「French Kissing」ダンスチャレンジについて、制作ガイドの変更点と、新しく始まった友達紹介をご案内します。',
    guideHeading: '1. 親指の動きを、1回だけ折る形に変更',
    guideBody: 'ガイド動画の9秒付近と16秒付近（「French Kissing」）にある親指の動きは、各箇所で1回だけ折る形に変更して踊ってください。撮影・投稿前に、最新のガイドをご確認ください。',
    guideButton: '最新の制作ガイドを確認する',
    guideUrl: 'https://and2ble-hub.vercel.app/guideline/guide-ja.html',
    filmed: 'すでに撮影・投稿済みで、変更への対応を確認したい場合は、このメールにご返信ください。',
    referralHeading: '2. 友達の紹介で、1人につき2,000円相当を追加',
    referralBody: 'まだキャンペーンに申し込んでいないお友達をご紹介いただけます。お友達の新規登録と、ガイドに沿った実際の参加が認定されると、紹介者の最終リワードに1人につき2,000円相当を加算します。',
    steps: '紹介ページで「あなたのSNS ID → お友達のアカウント」を入力し、「この友達を紹介する」を押してください。その後に表示されるリンクを、お友達へお送りください。',
    referralButton: '友達を紹介する',
    referralUrl: 'https://and2ble-hub.vercel.app/referral/?lang=ja',
    rules: ['すでにキャンペーンに登録済みのお友達は、紹介対象になりません。', '紹介されたお友達への追加紹介特典はありません。通常の参加リワードはキャンペーンの条件に従います。', '紹介の登録だけではリワードは確定しません。お友達の実際の参加まで認定された場合に反映します。'],
    tracking: 'お友達の登録状況は自動で照合します。確認が必要な場合は、このメールへのご返信でもお問い合わせいただけます。',
    closing: '引き続き、どうぞよろしくお願いいたします。',
    signature: 'SIRIAI キャンペーン運営チーム'
  },
  ko: {
    subject: '[한국어 검수용] [SIRIAI] AND2BLE 가이드 변경 및 친구추천 안내',
    heading: '안무 가이드 변경 및 친구추천 오픈 안내',
    greeting: '안녕하세요. SIRIAI(시리아이) 캠페인 운영팀입니다.',
    intro: 'AND2BLE 「French Kissing」 댄스 챌린지의 제작 가이드 변경 사항과 새로 열린 친구추천을 안내드립니다.',
    guideHeading: '1. 엄지 동작은 한 번만 접는 것으로 변경',
    guideBody: '가이드 영상 기준 9초 부근과 16초 부근(「French Kissing」)의 엄지 동작은 각 구간에서 한 번만 접는 것으로 수정해 진행해 주세요. 촬영·게시 전 최신 가이드를 확인해 주세요.',
    guideButton: '최신 제작 가이드 확인하기',
    guideUrl: 'https://and2ble-hub.vercel.app/guideline/guide-ko.html',
    filmed: '이미 촬영·게시하셨고 변경 사항의 대응을 확인하고 싶으시면 이 메일로 회신해 주세요.',
    referralHeading: '2. 친구 소개 시 1명당 2,000엔 상당 추가',
    referralBody: '아직 캠페인에 신청하지 않은 친구를 소개해 주세요. 친구의 신규 등록과 가이드에 맞는 실제 참여까지 인정되면, 추천인의 최종 리워드에 친구 1명당 2,000엔 상당을 추가합니다.',
    steps: '추천 페이지에서 내 SNS 아이디 → 친구 계정을 입력하고 ‘이 친구 추천하기’를 누르세요. 그다음 표시되는 링크를 친구에게 보내 주세요.',
    referralButton: '친구 소개하기',
    referralUrl: 'https://and2ble-hub.vercel.app/referral/?lang=ko',
    rules: ['이미 캠페인에 등록한 친구는 추천 대상이 아닙니다.', '추천받은 친구에게 추가 추천 보상은 없습니다. 기본 참여 리워드는 캠페인 조건을 따릅니다.', '추천 등록만으로 보상이 확정되지는 않습니다. 친구의 실제 참여까지 인정된 경우에 반영됩니다.'],
    tracking: '친구 등록 여부는 자동으로 대조됩니다. 확인이 필요하시면 이 메일에 회신하여 문의하셔도 됩니다.',
    closing: '계속해서 잘 부탁드립니다. 감사합니다.',
    signature: 'SIRIAI 캠페인 운영팀'
  }
};

function announcementHtml(lang) {
  const c = ANNOUNCEMENT_COPY[lang];
  const p = text => '<p style="margin:0 0 18px">' + text + '</p>';
  const button = (text, url) => '<p style="margin:24px 0"><a href="' + url + '" style="display:inline-block;max-width:100%;box-sizing:border-box;padding:14px 20px;background:#242620;color:#fff;font-weight:bold;text-decoration:none;border-radius:6px;line-height:1.5">' + text + '</a></p><p style="font-size:12px;overflow-wrap:anywhere;word-break:break-all;margin:0 0 24px"><a href="' + url + '" style="color:#315d3d">' + url + '</a></p>';
  return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + c.subject + '</title></head><body style="margin:0;padding:20px 12px;background:#f4f3ef"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#fff;border-collapse:collapse"><tr><td style="padding:24px 20px;font-family:Arial,\'Yu Gothic\',Meiryo,\'Malgun Gothic\',sans-serif;font-size:15px;line-height:1.85;color:#242620;word-break:' + (lang === 'ko' ? 'keep-all' : 'normal') + ';overflow-wrap:anywhere">'
    + '<p style="font-size:11px;letter-spacing:2px;font-weight:bold;color:#63695d">SIRIAI / AND2BLE</p><h1 style="font-size:23px;line-height:1.5;margin:16px 0 24px">' + c.heading + '</h1>'
    + (lang === 'ko' ? p('<strong>한국어 내부 검수용입니다. 실제 발송에는 일본어 문안을 사용해 주세요.</strong>') : '')
    + p(c.greeting) + p(c.intro)
    + '<h2 style="font-size:19px;line-height:1.6;margin:28px 0 12px">' + c.guideHeading + '</h2>' + p(c.guideBody) + button(c.guideButton, c.guideUrl) + p(c.filmed)
    + '<h2 style="font-size:19px;line-height:1.6;margin:28px 0 12px">' + c.referralHeading + '</h2>' + p(c.referralBody) + p(c.steps) + button(c.referralButton, c.referralUrl)
    + '<ul style="padding-left:20px;margin:0 0 20px">' + c.rules.map(rule => '<li style="margin-bottom:10px">' + rule + '</li>').join('') + '</ul>' + p(c.tracking) + p(c.closing)
    + '<p style="border-top:1px solid #ddd;padding-top:20px;margin:28px 0 0;font-size:13px">' + c.signature + '<br><a href="mailto:sbsiriai@gmail.com" style="color:#315d3d">sbsiriai@gmail.com</a></p></td></tr></table></body></html>';
}

EMAIL_TEMPLATES.unshift(...['ja', 'ko'].map(lang => ({
  id: 'guide-update-' + lang,
  stage: 'guide-update',
  title: '가이드 변경 · 친구추천 오픈 안내',
  lang,
  subject: ANNOUNCEMENT_COPY[lang].subject,
  html: announcementHtml(lang),
  fields: [],
  note: '전체 대상 공지용입니다. 가이드 영상 9초·16초 부근 엄지 동작 1회 변경과 친구추천 오픈을 안내합니다. 이미 촬영·게시한 경우의 대응은 운영팀 문의로 안내합니다.'
})));
