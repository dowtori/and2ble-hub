const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../dist'),ctx={};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'mail-data.js'),'utf8')+';this.templates=EMAIL_TEMPLATES;',ctx);
const variants=ctx.templates.filter(m=>m.stage==='confirmed');assert.equal(variants.length,6);
for(const lang of ['ja','ko'])for(const plan of ['instagram','tiktok','both']){
 const m=variants.find(m=>m.plan===plan&&m.lang===lang);assert(m);
 const html=m.html,ja=lang==='ja',both=plan==='both';
 assert(html.includes('00:16'));assert(html.includes(ja?'最後の1〜2秒':'마지막 1~2초'));
 assert(html.includes('https://drive.google.com/drive/folders/1cB-swBzwm-vKxG98LwJRP6DaLqUM-oLV?usp=sharing'));
 assert(html.includes('https://and2ble-hub.vercel.app/guideline/guide-'+lang+'.html'));
 assert.equal(html.includes('tiktok.com/music/'),plan!=='instagram');
 assert.equal(html.includes('instagram.com/reels/audio/'),plan!=='tiktok');
 assert.equal(html.includes('and2ble-instagram-guide.vercel.app/?lang='+lang),plan!=='tiktok');
 assert.equal(html.includes(ja?'動画の元の音声を100%、追加した公式音源を0%':'영상 원본 소리 100% / 추가한 공식 음원 0%'),plan!=='tiktok');
 assert.equal(html.includes(ja?'撮影場所も衣装も':'완전히 다른 장소, 완전히 다른 복장'),both);
 assert.equal(html.includes(ja?'1本分のみ':'한 콘텐츠만 인정'),both);
 assert(html.includes(both?(ja?'計2本':'총 2개'):(ja?'（1本）':'URL 1개')));
 if(!both)assert(!html.includes(plan==='instagram'?'TikTok':'Instagram'));
 assert(!m.fields.includes('PARTICIPATION_PLAN'));
 assert.equal(m.fields.includes('UPLOAD_DATE_TIKTOK_JST'),both);assert.equal(m.fields.includes('UPLOAD_DATE_INSTAGRAM_JST'),both);
 assert.equal(fs.readFileSync(path.join(root,'downloads',m.id+'.html'),'utf8'),html);
 const filled=html.replace(/\{\{([A-Z_]+)\}\}/g,(s,k)=>({UPLOAD_DATE_TIKTOK_JST:'2026年11月10日',UPLOAD_DATE_INSTAGRAM_JST:'2026年11月12日'}[k]||'TEST'));
 assert(!filled.includes('{{'));if(both){assert(filled.includes('2026年11月10日'));assert(filled.includes('2026年11月12日'));}
 console.log(m.id+': correct platform content, links, dates, URL count and download');
}
