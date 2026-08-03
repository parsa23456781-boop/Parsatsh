/* ==========================================================================
   MAP — اسکریپت مشترک همه‌ی صفحه‌ها
   تم، حالت روشن/تاریک، جست‌وجو، ورود، توست
   ========================================================================== */

/* ---------- حافظه‌ی محلی امن (اگر مرورگر اجازه نداد، برنامه نمی‌شکند) ---------- */
const store = {
  get(k, fallback) {
    try { const v = localStorage.getItem(k); return v === null ? fallback : v; }
    catch (e) { return fallback; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* حالت مهمان */ }
  }
};

/* ---------- ابزار ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/** عدد را با ارقام فارسی و جداکننده‌ی هزارگان برمی‌گرداند */
const faNum = n => Number(n).toLocaleString('en-US');
/* ---------- ۱. تم و حالت ---------- */
const THEMES = ['steel', 'copper', 'indigo', 'emerald', 'furnace'];

function applyTheme(name) {
  if (!THEMES.includes(name)) name = 'steel';
  document.documentElement.setAttribute('data-theme', name);
  store.set('map.theme', name);
  $$('.swatch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === name)));
}

function applyMode(mode) {
  const m = mode === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-mode', m);
  store.set('map.mode', m);
  const btn = $('#modeBtn');
  if (btn) {
    btn.setAttribute('aria-label', m === 'dark' ? 'روشن کردن صفحه' : 'تاریک کردن صفحه');
    $('#iconSun').style.display  = m === 'dark' ? 'block' : 'none';
    $('#iconMoon').style.display = m === 'dark' ? 'none' : 'block';
  }
}

/* ---------- ۲. داده‌ی نمونه‌ی محصولات ----------
   هشدار: این قیمت‌ها فقط داده‌ی نمایشی (دمو) هستند و مرجع مهندسی نیستند.
   بعداً باید از API قیمت‌گذاری واقعی خوانده شوند.                       */
const PRODUCTS = [
  { id: 'shaft-48',  name: 'شفت فولادی St37',      meta: 'Ø48 × 2000 میلی‌متر · بار ثابت', price: 4722672,  unit: 'هر شاخه', tag: 'شفت', icon: 'shaft' },
  { id: 'shaft-ss',  name: 'شفت استنلس SS 304',    meta: 'Ø48 × 2000 میلی‌متر · ضدزنگ',    price: 10238229, unit: 'هر شاخه', tag: 'شفت', icon: 'shaft' },
  { id: 'shaft-al',  name: 'شفت آلومینیوم 6061-T6', meta: 'Ø48 × 2000 میلی‌متر · سبک',      price: 10426837, unit: 'هر شاخه', tag: 'شفت', icon: 'shaft' },
  { id: 'gear-m3',   name: 'چرخ‌دنده ساده مدول 3',   meta: 'z=24 · فولاد 1.7225',            price: 3180000,  unit: 'هر عدد',  tag: 'چرخ‌دنده', icon: 'gear' },
  { id: 'flange-dn80', name: 'فلنج DN80 کلاس 150',  meta: 'فولاد کربنی · جوشی',             price: 1450000,  unit: 'هر عدد',  tag: 'فلنج', icon: 'flange' },
  { id: 'brg-6208',  name: 'یاتاقان بلبرینگی 6208', meta: 'قطر داخلی 40 میلی‌متر',          price: 890000,   unit: 'هر عدد',  tag: 'یاتاقان', icon: 'bearing' },
  { id: 'key-14',    name: 'خار موازی 14×9',        meta: 'DIN 6885 · فولاد C45',           price: 120000,   unit: 'هر عدد',  tag: 'خار', icon: 'key' },
  { id: 'plate-10',  name: 'ورق فولادی 10 میلی‌متر', meta: 'St37 · برش لیزر',                price: 2650000,  unit: 'هر مترمربع', tag: 'ورق', icon: 'plate' }
];

const ICONS = {
  shaft:   '<svg viewBox="0 0 120 40" fill="none"><rect x="6" y="13" width="108" height="14" rx="3" class="stroke" stroke-width="2"/><rect x="30" y="9" width="16" height="22" rx="2" class="stroke" stroke-width="2"/></svg>',
  gear:    '<svg viewBox="0 0 120 60" fill="none"><circle cx="60" cy="30" r="18" class="stroke" stroke-width="2"/><circle cx="60" cy="30" r="6" class="stroke" stroke-width="2"/><g class="stroke" stroke-width="2"><path d="M60 6v6M60 48v6M36 30h-6M90 30h6M43 13l-4-4M77 13l4-4M43 47l-4 4M77 47l4 4"/></g></svg>',
  flange:  '<svg viewBox="0 0 120 60" fill="none"><circle cx="60" cy="30" r="22" class="stroke" stroke-width="2"/><circle cx="60" cy="30" r="9" class="stroke" stroke-width="2"/><g class="stroke" stroke-width="2"><circle cx="60" cy="13" r="2.5"/><circle cx="60" cy="47" r="2.5"/><circle cx="43" cy="30" r="2.5"/><circle cx="77" cy="30" r="2.5"/></g></svg>',
  bearing: '<svg viewBox="0 0 120 60" fill="none"><circle cx="60" cy="30" r="22" class="stroke" stroke-width="2"/><circle cx="60" cy="30" r="11" class="stroke" stroke-width="2"/><g class="stroke" stroke-width="1.6"><circle cx="60" cy="13.5" r="3.5"/><circle cx="60" cy="46.5" r="3.5"/><circle cx="43.5" cy="30" r="3.5"/><circle cx="76.5" cy="30" r="3.5"/></g></svg>',
  key:     '<svg viewBox="0 0 120 40" fill="none"><rect x="24" y="14" width="72" height="12" rx="2" class="stroke" stroke-width="2"/></svg>',
  plate:   '<svg viewBox="0 0 120 60" fill="none"><path d="M18 40l24-18h60l-24 18z" class="stroke" stroke-width="2"/><path d="M18 40v6l24 4v-6M102 22v6l-24 18v-6" class="stroke" stroke-width="2"/></svg>'
};

/* ---------- ۳. جست‌وجو ---------- */
function initSearch() {
  const input = $('#searchInput');
  const box   = $('#searchResults');
  if (!input || !box) return;

  const isHome = document.body.dataset.page === 'home';

  function render(q) {
    const query = q.trim();
    if (!query) { box.dataset.open = 'false'; box.innerHTML = ''; clearHits(); return; }

    const hits = PRODUCTS.filter(p =>
      (p.name + ' ' + p.meta + ' ' + p.tag).toLowerCase().includes(query.toLowerCase())
    );

    box.dataset.open = 'true';
    box.innerHTML = hits.length
      ? hits.map(p => `
          <button class="sresult" data-id="${p.id}">
            <span>
              <span class="sresult__t">${p.name}</span><br>
              <span class="sresult__m">${p.meta}</span>
            </span>
            <span class="sresult__p num">${faNum(p.price)} ت</span>
          </button>`).join('')
      : `<div class="sresult--empty">چیزی پیدا نشد. مثلاً «شفت»، «چرخ‌دنده» یا «فلنج» را امتحان کنید.</div>`;

    highlight(hits.map(h => h.id));
  }

  function highlight(ids) {
    $$('.product').forEach(el => {
      el.dataset.hit = String(ids.includes(el.dataset.id));
    });
  }

  function clearHits() { $$('.product').forEach(el => (el.dataset.hit = 'false')); }

  input.addEventListener('input', e => render(e.target.value));

  box.addEventListener('click', e => {
    const btn = e.target.closest('.sresult');
    if (!btn) return;
    box.dataset.open = 'false';
    if (isHome) {
      const card = $(`.product[data-id="${btn.dataset.id}"]`);
      if (card) { card.scrollIntoView({ block: 'center' }); card.dataset.hit = 'true'; }
    } else {
      location.href = 'index.html#products';
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.search')) box.dataset.open = 'false';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; render(''); input.blur(); }
  });

  // میان‌بر «/» برای رفتن به جست‌وجو
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });
}

/* ---------- ۴. توست ---------- */
let toastTimer;
function toast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.dataset.open = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.dataset.open = 'false'), 3200);
}

/* ---------- ۵. ورود / ثبت‌نام (فعلاً بدون سرور) ---------- */
function initAuth() {
  const modal = $('#authModal');
  if (!modal) return;

  const open  = () => { modal.dataset.open = 'true'; setTimeout(() => $('#authId')?.focus(), 60); };
  const close = () => { modal.dataset.open = 'false'; $('#authErr').textContent = ''; };

  $$('[data-open-auth]').forEach(b => b.addEventListener('click', open));
  $('#authClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  let mode = 'login';
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    mode = tab.dataset.mode;
    $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    $('#authSubmit').textContent = mode === 'login' ? 'ورود به حساب' : 'ساخت حساب';
    $('#nameField').style.display = mode === 'login' ? 'none' : 'block';
    $('#authErr').textContent = '';
  }));

  $('#authSubmit').addEventListener('click', () => {
    const id  = $('#authId').value.trim();
    const pw  = $('#authPw').value;
    const err = $('#authErr');

    if (!/^(09\d{9}|[^@\s]+@[^@\s]+\.[a-z]{2,})$/i.test(id)) {
      err.textContent = 'شماره موبایل (۰۹xxxxxxxxx) یا ایمیل معتبر وارد کنید.';
      return;
    }
    if (pw.length < 6) { err.textContent = 'گذرواژه باید حداقل ۶ نویسه باشد.'; return; }

    err.textContent = '';
    const label = mode === 'login' ? 'وارد شدید' : 'حساب ساخته شد';
    store.set('map.user', id);
    paintUser(id);
    close();
    toast(`${label} — این نسخه‌ی نمایشی است و هنوز به سرور وصل نیست.`);
  });
}

function paintUser(id) {
  const btn = $('#loginBtn');
  if (!btn || !id) return;
  btn.querySelector('span').textContent = id.length > 14 ? id.slice(0, 12) + '…' : id;
}

/* ---------- ۶. راه‌اندازی ---------- */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(store.get('map.theme', 'steel'));
  applyMode(store.get('map.mode', 'dark'));
  paintUser(store.get('map.user', ''));


  $('#modeBtn')?.addEventListener('click', () => {
    applyMode(document.documentElement.getAttribute('data-mode') === 'dark' ? 'light' : 'dark');
  });

  $$('#nav a').forEach(a => a.addEventListener('click', () => {
    if (nav) nav.dataset.open = 'false';
  }));
  const panel = $('#themePanel');
  $('#themeBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    panel.dataset.open = panel.dataset.open === 'true' ? 'false' : 'true';
  });
  document.addEventListener('click', e => {
    if (panel && !e.target.closest('.themepick')) panel.dataset.open = 'false';
  });
  $$('.swatch').forEach(b => b.addEventListener('click', () => applyTheme(b.dataset.theme)));

  const nav = $('#nav');
  $('#menuBtn')?.addEventListener('click', () => {
    nav.dataset.open = nav.dataset.open === 'true' ? 'false' : 'true';
  });
  initSearch();
  initAuth();
});
/* ---------- انیمیشن اسکرول ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);

  addEventListener('scroll', () => {
    const max = document.body.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(${max > 0 ? scrollY / max : 0})';
  }, { passive: true });

  const targets = $$('.section__head, .card, .product, .metrics > div, .stub__box, .hero h1, .hero p.lead, .hero__cta');
  targets.forEach(el => el.classList.add('reveal'));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .12, rootMargin: '0px 0px -60px 0px' });

  targets.forEach(el => io.observe(el));
});
