// 상세 가이드: 플랫폼 선택(TikTok / Instagram / 둘 다)에 따라 필요한 설명만 보여 준다.
// 선택 카드 · 상단 고정 바 · 체크리스트 위 선택지 세 곳이 서로 연동된다.
(function () {
  var KEY = 'and2ble_plat';
  var inputs = document.querySelectorAll('[data-plat-input]');

  var ja = document.documentElement.lang !== 'ko';
  var NAME = ja ? { tt: 'TikTok', ig: 'Instagram', both: 'TikTok・Instagram 両方' }
                : { tt: 'TikTok', ig: 'Instagram', both: 'TikTok·Instagram 둘 다' };
  var MSG = ja ? {
    none: '選ぶと、下の説明がその投稿先用に切り替わります',
    now: function (n) { return '<b>' + n + '用の説明に切り替えました</b>必要な説明だけを下に表示しています'; },
    toast: function (n) { return n + '用の説明に切り替えました'; }
  } : {
    none: '고르면 아래 설명이 그 플랫폼에 맞게 바뀌어요',
    now: function (n) { return '<b>' + n + ' 기준 안내로 바뀌었어요</b>필요한 내용만 아래에 보여 드려요'; },
    toast: function (n) { return n + ' 기준 안내로 바뀌었어요'; }
  };
  var now = document.querySelector('.pick-now');
  var toast = document.querySelector('.toast');
  var toastTimer;

  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // 선택이 바뀐 걸 확실히 보여 준다: 상태 문구, 카드 반짝임, 하단 알림
  function feedback(v) {
    replay(now, 'flash');
    document.querySelectorAll('.wrap > section.card, .start-reward').forEach(function (el) {
      if (el.offsetParent !== null) replay(el, 'plat-swap');
    });
    if (toast) {
      toast.textContent = MSG.toast(NAME[v]);
      toast.style.background = '';
      toast.classList.add('plat', 'show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show', 'plat'); }, 2000);
    }
  }

  // 보던 위치 유지: 바꾸기 전에 화면 위쪽에 있던 섹션을 기억했다가, 바꾼 뒤 같은 자리에 다시 맞춘다.
  document.documentElement.style.overflowAnchor = 'none';
  function anchorSection() {
    var list = document.querySelectorAll('.wrap > section');
    for (var k = 0; k < list.length; k++) {
      var r = list[k].getBoundingClientRect();
      if (list[k].offsetParent !== null && r.bottom > 120) return { el: list[k], top: r.top };
    }
    return null;
  }

  function apply(v, save) {
    if (!v) return;
    var a = save ? anchorSection() : null;
    document.body.setAttribute('data-plat', v);
    if (a) {
      var html = document.documentElement, sb = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      if (a.el.offsetParent !== null) window.scrollBy(0, a.el.getBoundingClientRect().top - a.top);
      else { var up = document.getElementById('upload'); if (up) window.scrollTo(0, up.getBoundingClientRect().top + window.scrollY - 110); }
      html.style.scrollBehavior = sb;
    }
    inputs.forEach(function (i) { i.checked = i.value === v; });
    if (now) now.innerHTML = MSG.now(NAME[v]);
    if (save) { try { localStorage.setItem(KEY, v); } catch (e) {} feedback(v); }
    document.dispatchEvent(new Event('platchange'));
  }
  if (now) now.textContent = MSG.none;

  inputs.forEach(function (i) {
    i.addEventListener('change', function () { if (i.checked) apply(i.value, true); });
  });

  // 플랫폼 전용 가이드(guide-tt-*, guide-ig-*)는 data-plat-lock 으로 고정되어 저장된 선택을 쓰지 않는다.
  var saved = null;
  if (!document.body.hasAttribute('data-plat-lock')) {
    try { saved = localStorage.getItem(KEY); } catch (e) {}
  }
  if (saved) apply(saved, false);

  // 상단 고정 바: 원래 선택 카드를 지나간 뒤부터 '업로드 전 최종 체크' 섹션이 화면 위쪽에 닿기 전까지 계속 보인다.
  var bar = document.getElementById('platSticky');
  var pick = document.getElementById('pick');
  var pick2 = document.getElementById('check');
  if (bar && pick) {
    var update = function () {
      var past = pick.getBoundingClientRect().bottom < 0;
      var before = !pick2 || pick2.getBoundingClientRect().top > 140;
      bar.classList.toggle('show', past && before);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    document.addEventListener('platchange', update);
    update();
  }
})();

// 업로드 방법: 두 곳 다 보일 때는 TikTok / Instagram 탭으로 나눠서 하나씩 보여 준다.
(function () {
  var up = document.getElementById('upload');
  if (!up) return;
  var btns = up.querySelectorAll('[data-up]');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      up.setAttribute('data-tab', b.getAttribute('data-up'));
      btns.forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    });
  });
})();
