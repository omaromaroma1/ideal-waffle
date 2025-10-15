(function(){
  // Inject small menu next to top-right plus
  function ensureMenu(){
    if (document.getElementById('mbInlineMenu')) return;
    const wrap = document.createElement('div');
    wrap.id = 'mbInlineMenu';
    wrap.innerHTML = '<div class="sheet">\
<button class="item" data-target="repeat">Repeat</button>\
<div class="sep"></div>\
<button class="item" data-target="one-time">One time</button>\
</div>';
    document.body.appendChild(wrap);
  }
  function findPlus(){
    const ids = ['plusBtn','addNew','addBtn','add','plus'];
    for (const id of ids){ const el = document.getElementById(id); if (el) return el; }
    // heuristic: top-right candidate
    const cands = Array.from(document.querySelectorAll('button, a, div'));
    let best=null, bestScore=-1;
    cands.forEach(el=>{
      const txt = (el.textContent||'').trim();
      const aria = (el.getAttribute && el.getAttribute('aria-label') || '').toLowerCase();
      if (txt==='+' || txt.toLowerCase()==='add new' || aria.includes('add') || aria.includes('plus')){
        const r = el.getBoundingClientRect();
        const score = (window.innerWidth - r.right) + r.top;
        const s = -score;
        if (s>bestScore){ bestScore=s; best=el; }
      }
    });
    return best;
  }
  function positionMenu(btn){
    const menu = document.getElementById('mbInlineMenu');
    const r = btn.getBoundingClientRect();
    const top = Math.max(0, r.bottom + 6 + window.scrollY);
    const left = Math.max(8, (r.right - 180) + window.scrollX);
    menu.style.top = top + 'px';
    menu.style.left = left + 'px';
  }
  function openMenu(btn){
    ensureMenu();
    positionMenu(btn);
    const menu = document.getElementById('mbInlineMenu');
    menu.style.display = 'block';
    const onDoc = (e)=>{
      if (!menu.contains(e.target)){ menu.style.display = 'none'; document.removeEventListener('click', onDoc, true); }
    };
    setTimeout(()=>document.addEventListener('click', onDoc, true), 0);
  }
  function init(){
    ensureMenu();
    const plus = findPlus();
    if (!plus) return;
    plus.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation(); openMenu(plus);
    }, true);
    const menu = document.getElementById('mbInlineMenu');
    menu.addEventListener('click', function(e){
      const btn = e.target.closest('button[data-target]'); if (!btn) return;
      const mode = btn.getAttribute('data-target');
      const base = window.location.pathname.replace(/repeat\.html.*$/,'').replace(/\/$/, '');
      window.location.href = base + (mode==='repeat' ? '/repeat_add.html' : '/one_time_add.html');
    });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();