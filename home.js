/* ==========================================================================
   MAP — منطق صفحه‌ی اصلی
   چت دمو + پنل طراحی زنده + شبکه‌ی محصولات

   ⚠️ توجه مهم:
   همه‌ی محاسبه‌ها و قیمت‌های این فایل «نمایشی» هستند و ارزش مهندسی ندارند.
   قرار است بعداً جای آن‌ها، خروجی موتور محاسبات (shaft_fatigue_v3) و
   API قیمت واقعی بنشیند. نقطه‌ی اتصال: تابع solve() در همین فایل.
   ========================================================================== */

/* ---------- ثابت‌های پایه (فعلاً دمو) ---------- */
const BASE = { torque: 560, length: 2000, dia: 48, safety: 2.0, load: 'ثابت و یکنواخت' };

const MATERIALS = [
  { key: 'st37', name: 'St37 (S235JR)', density: 7850, pricePerKg: 166233,  best: true  },
  { key: 'ss304', name: 'SS 304',       density: 7900, pricePerKg: 358105,  best: false },
  { key: 'al6061', name: 'Al 6061-T6',  density: 2700, pricePerKg: 1067161, best: false }
];

const USD_RATE = 193000; // نرخ نمایشی برای نمایش تقریبی دلاری

const state = { ...BASE };

/* ---------- محاسبه‌ی نمایشی ---------- */
/**
 * قطر را نسبت به حالت پایه با قانون پیچش (d ∝ T^(1/3)) تخمین می‌زند.
 * این فقط برای زنده‌بودن رابط است؛ عدد نهایی باید از موتور محاسبات بیاید.
 */
function solve() {
  const dia = BASE.dia * Math.cbrt((state.torque / BASE.torque) * (state.safety / BASE.safety));
  state.dia = Math.max(8, Math.round(dia));

  const volume = Math.PI / 4 * Math.pow(state.dia / 1000, 2) * (state.length / 1000); // m³
  return MATERIALS.map(m => ({
    ...m,
    mass: volume * m.density,
    price: Math.round(volume * m.density * m.pricePerKg)
  }));
}

/* ---------- رسم پنل ---------- */
function drawPanel() {
  const rows = solve();
  const max = Math.max(...rows.map(r => r.price));
  const best = rows.reduce((a, b) => (a.price <= b.price ? a : b));

  $('#specTorque').textContent = faNum(state.torque) + ' N·m';
  $('#specLength').textContent = faNum(state.length) + ' mm';
  $('#specLoad').textContent   = state.load;
  $('#specSafety').textContent = state.safety.toLocaleString('fa-IR', { minimumFractionDigits: 1 });

  $('#dimLength').textContent = faNum(state.length) + ' mm';
  $('#dimDia').textContent    = 'Ø' + faNum(state.dia);
  $('#draftId').textContent   = 'DRAFT · SHAFT-' + String(184 + Math.round(state.torque / 10)).padStart(5, '0');

  // ضخامت شفت در نقشه با قطر واقعی نسبت دارد
  const h = Math.min(64, Math.max(14, state.dia * 0.9));
  const body = $('#shaftBody');
  body.setAttribute('height', h);
  body.setAttribute('y', 70 - h / 2);
  const step = $('#shaftStep');
  step.setAttribute('height', h + 16);
  step.setAttribute('y', 70 - (h + 16) / 2);

  $('#matList').innerHTML = rows.map(r => `
    <div class="mat ${r.key === best.key ? '' : 'mat--dim'}">
      <div class="mat__top">
        <span>${r.name}</span>
        ${r.key === best.key ? '<span class="badge">بهینه</span>' : ''}
        <span class="mat__price num">${faNum(r.price)} ت</span>
      </div>
      <div class="bar"><i style="width:${Math.round(r.price / max * 100)}%"></i></div>
    </div>`).join('');

  $('#totalValue').textContent = faNum(best.price);
  $('#totalUsd').textContent   = '≈ ' + (best.price / USD_RATE).toFixed(2) + ' $';
  $('#totalMat').textContent   = best.name + ' · جرم تقریبی ' + best.mass.toFixed(1) + ' kg';
}

/* ---------- چت ---------- */
const SCRIPT = [
  'باشه، یادداشت کردم. یک سؤال کوتاه: این شفت شیار خار (Keyway) هم دارد یا نه؟',
  'عالی، اطلاعات کافی است. دارم چند جنس مختلف را از نظر قیمت و ایمنی مقایسه می‌کنم…',
  'نتیجه را کنار همین پیام، در پنل طراحی می‌بینی. می‌خواهی همین را نهایی کنم؟'
];

let step = 0;

function addMsg(text, who = 'bot') {
  const log = $('#chatLog');
  const el = document.createElement('div');
  el.className = 'msg msg--' + (who === 'me' ? 'me' : 'bot');
  el.innerHTML = `
    <div class="msg__av">${who === 'me' ? 'شما' : 'M'}</div>
    <div>
      ${who === 'bot' ? '<div class="msg__name">دستیار</div>' : ''}
      <div class="msg__body">${text}</div>
    </div>`;
  log.appendChild(el);
  log.scrollTop = log.scrollHeight;
  return el;
}

function showTyping() {
  const el = addMsg('<span class="typing"><i></i><i></i><i></i></span>');
  el.dataset.typing = 'true';
  return el;
}

/** عددهای داخل پیام کاربر را می‌خواند و مشخصات را به‌روز می‌کند */
function readSpecs(text) {
  const t = text.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  let changed = false;

  const torque = t.match(/(\d+(?:\.\d+)?)\s*(?:نیوتن\s*متر|نیوتن‌متر|n\.?m|n·m)/i);
  if (torque) { state.torque = parseFloat(torque[1]); changed = true; }

  const meter = t.match(/(\d+(?:\.\d+)?)\s*متر(?!\s*مربع)/);
  const mm    = t.match(/(\d+(?:\.\d+)?)\s*(?:میلی\s*متر|میلی‌متر|mm)/i);
  if (mm)         { state.length = parseFloat(mm[1]); changed = true; }
  else if (meter) { state.length = parseFloat(meter[1]) * 1000; changed = true; }

  const n = t.match(/ضریب\s*اطمینان\s*(\d+(?:\.\d+)?)/);
  if (n) { state.safety = parseFloat(n[1]); changed = true; }

  if (/ضربه|متغیر|نوسان/.test(t)) { state.load = 'متغیر و ضربه‌ای'; changed = true; }
  else if (/ثابت|یکنواخت/.test(t)) { state.load = 'ثابت و یکنواخت'; changed = true; }

  return changed;
}

function send(text) {
  const value = text.trim();
  if (!value) return;

  addMsg(value, 'me');
  $('#chatInput').value = '';

  const changed = readSpecs(value);
  const typing = showTyping();

  setTimeout(() => {
    typing.remove();
    const reply = step < SCRIPT.length
      ? SCRIPT[step++]
      : (changed
          ? 'تغییر را اعمال کردم — پنل طراحی همین حالا به‌روز شد.'
          : 'متوجه شدم. اگر گشتاور، طول یا ضریب اطمینان را بگویی، طرح را دوباره حساب می‌کنم.');
    addMsg(reply);
    if (changed || step === SCRIPT.length) drawPanel();
  }, 780);
}

/* ---------- شبکه‌ی محصولات ---------- */
function drawProducts() {
  $('#productGrid').innerHTML = PRODUCTS.map(p => `
    <article class="product" data-id="${p.id}" data-hit="false">
      <div class="product__thumb">${ICONS[p.icon] || ICONS.shaft}</div>
      <div>
        <div class="product__name">${p.name}</div>
        <div class="product__meta">${p.meta}</div>
      </div>
      <div class="product__foot">
        <div>
          <div class="product__price num">${faNum(p.price)} تومان</div>
          <div class="product__unit">${p.unit}</div>
        </div>
        <button class="btn product__btn" data-ask="${p.name}">طراحی مشابه</button>
      </div>
    </article>`).join('');
}


/* ---------- کشوی جزئیات قطعه ---------- */
function openDrawer(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const idx = String(PRODUCTS.indexOf(p) + 1).padStart(2, '0');

  $('#drawerIdx').textContent  = idx + '.';
  $('#drawerName').textContent = p.name;
  $('#drawerDesc').textContent =
    `${p.meta} — این قطعه از بانک داده‌ی نمونه‌ی MAP خوانده شده است. `
    + 'پس از اتصال به موتور محاسبات، مشخصات مکانیکی، ضریب اطمینان و نقشه‌ی نهایی همین‌جا نمایش داده می‌شود.';
  $('#drawerHero').innerHTML = ICONS[p.icon] || ICONS.shaft;
  $('#drawerRows').innerHTML = [
    ['قیمت واحد', faNum(p.price) + ' ت'],
    ['واحد فروش', p.unit],
    ['دسته', p.tag]
  ].map(([k, v]) => `<div class="drawer__row"><span>${k}</span><span>${v}</span></div>`).join('');

  $('#drawer').dataset.open = 'true';
  $('#drawerClose').focus();
}

function closeDrawer() { $('#drawer').dataset.open = 'false'; }

/* ---------- راه‌اندازی ---------- */
document.addEventListener('DOMContentLoaded', () => {
  drawProducts();
  drawPanel();

  $('#sendBtn').addEventListener('click', () => send($('#chatInput').value));

  $('#chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e.target.value); }
  });

  $$('.chip').forEach(c => c.addEventListener('click', () => send(c.textContent)));

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-ask]');
    if (!btn) return;
    $('#chat').scrollIntoView({ block: 'center' });
    send(`یک نمونه شبیه «${btn.dataset.ask}» می‌خواهم.`);
  });

  $('#drawerClose').addEventListener('click', closeDrawer);
  $('#drawerVeil').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  document.addEventListener('click', e => {
    const card = e.target.closest('.product');
    if (card && !e.target.closest('[data-ask]')) openDrawer(card.dataset.id);
  });

  $$('[data-download]').forEach(b => b.addEventListener('click', () => {
    toast('خروجی فایل بعد از اتصال به موتور SolidWorks فعال می‌شود.');
  }));
});
