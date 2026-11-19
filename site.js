// REF CLIPS — site : bouton de téléchargement selon l'ordinateur, onglets Mac / Windows, démo « tape un code ».
// Les animations communes (apparitions, compteurs, carrousels, notifications) viennent de rt.js, le script du site Referee Tracker.
(() => {
  const EN = document.documentElement.lang === 'en';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

  /* Menu téléphone : se referme après un choix */
  $$('.menu-mob a').forEach(a => a.addEventListener('click', () => { const d = a.closest('details'); if (d) d.open = false; }));

  /* Mac / Windows */
  const isWin = /Windows/i.test(navigator.userAgent), isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
  const tab = os => {
    $$('[data-os]').forEach(b => { b.classList.toggle('on', b.dataset.os === os); b.setAttribute('aria-selected', b.dataset.os === os); });
    $$('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== os; });
  };
  $$('[data-os]').forEach(b => b.addEventListener('click', () => tab(b.dataset.os)));
  if (isWin) tab('win');

  /* Téléchargement : liens dans version.json (le même fichier que lit l'app pour proposer une nouvelle version) */
  const label = $('[data-os-label]');
  if (label && (isWin || isMac)) label.textContent = EN ? `Download for ${isWin ? 'Windows' : 'Mac'}` : `Télécharger pour ${isWin ? 'Windows' : 'Mac'}`;
  fetch((EN ? '../' : '') + 'version.json', { cache: 'no-store' }).then(r => r.json()).then(v => {
    const auto = isWin ? 'win' : isMac ? 'mac' : null;
    $$('[data-dl]').forEach(a => { const os = a.dataset.dl === 'auto' ? auto : a.dataset.dl; if (os && v?.[os]) a.href = v[os]; });
  }).catch(() => {}); // pas encore de lien : les boutons mènent à l'aide d'installation

  /* Démo : on tape le début d'un code, le clip se crée comme dans l'app */
  const CODES = [
    ['V-MAR', 'Marcher', 'Travelling', 'viol'], ['V-DRI', 'Reprise de dribble', 'Double dribble', 'viol'], ['V-3s', '3 secondes', '3 seconds', 'viol'],
    ['V-24s', '24 secondes', '24 seconds', 'viol'], ['F-DEF-POU', 'Pousser', 'Pushing', 'faute'], ['F-DEF-HOLD', 'Tenir', 'Holding', 'faute'],
    ['F-OFF-CHA', 'Charge', 'Charge', 'faute'], ['F-OFF-ECR', 'Écran illégal', 'Illegal screen', 'faute'], ['FAS-C1', 'Antisportive C1', 'Unsportsmanlike C1', 'faute'],
    ['M-AT-BAD', 'AT mauvaise position', 'Lead poor position', 'meca'], ['M-AK-BAD', 'AK mauvaise position', 'Trail poor position', 'meca'],
    ['G-TM', 'Temps-mort', 'Time-out', 'gest'], ['G-ENT', 'Gestion entraîneur', 'Coach management', 'gest'],
  ].map(([code, fr, en, cat]) => ({ code, label: EN ? en : fr, cat }));
  const THEME = EN ? { viol: 'Violations', faute: 'Fouls', meca: 'Mechanics', gest: 'Management' } : { viol: 'Violations', faute: 'Fautes', meca: 'Mécanique', gest: 'Gestion' };
  const input = $('#demoIn'), list = $('#demoSugg'), bar = $('#demoBar');
  if (!input) return;
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  let res = [], sel = 0, play = 58, count = {};
  const find = q => {
    q = norm(q.trim()); if (!q) return [];
    return CODES.map(c => { const l = norm(c.label);
      return { c, s: l.startsWith(q) ? 3 : l.split(/[\s(-]+/).some(w => w.startsWith(q)) ? 2 : norm(c.code).includes(q) ? 1 : 0 }; })
      .filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 4).map(x => x.c);
  };
  const draw = () => {
    list.innerHTML = res.map((c, i) => `<li role="option" aria-selected="${i === sel}" data-i="${i}" class="${i === sel ? 'on' : ''}"><em style="--c:var(--${c.cat})"></em><span>${c.label}</span><code>${c.code}</code></li>`).join('');
    input.setAttribute('aria-expanded', res.length > 0);
  };
  const mark = c => {
    if (!c) return;
    play = play >= 94 ? 6 : play + 3 + Math.random() * 4; // la lecture avance ; en fin de match, on repart du début
    const min = play / 100 * 40, qt = Math.min(4, Math.floor(play / 25) + 1);
    count[c.code] = (count[c.code] || 0) + 1;
    const m = document.createElement('i'); m.style.left = play + '%'; m.style.setProperty('--c', `var(--${c.cat})`); bar.appendChild(m);
    bar.querySelector('b').style.width = play + '%';
    $('#rCode').textContent = `${c.code} · ${c.label}`;
    $('#rTheme').textContent = THEME[c.cat];
    $('#rQt').textContent = `QT${qt} · ${String(Math.floor(min)).padStart(2, '0')}:${String(Math.floor(min % 1 * 60)).padStart(2, '0')}`;
    $('#rDur').textContent = '16 s';
    $('#rFile').textContent = `${c.code} (${count[c.code]}).mp4`;
    input.value = ''; res = []; draw();
  };
  input.addEventListener('input', () => { res = find(input.value); sel = 0; draw(); });
  input.addEventListener('keydown', e => {
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && res.length) { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : res.length - 1)) % res.length; draw(); }
    if (e.key === 'Enter') { e.preventDefault(); mark(res[sel]); }
    if (e.key === 'Escape') { input.value = ''; res = []; draw(); }
  });
  list.addEventListener('mousedown', e => { const li = e.target.closest('[data-i]'); if (li) { e.preventDefault(); mark(res[+li.dataset.i]); input.focus(); } });
})();
