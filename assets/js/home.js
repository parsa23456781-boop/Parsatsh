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
  $('#specSafety').textContent = state.safety.toFixed(1);
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
  /* ---------- ورودی‌های مختلف ---------- */
  const ACCEPT = {
    image: 'image/*',
    pdf:   '.pdf,.doc,.docx,.xls,.xlsx',
    cad:   '.step,.stp,.iges,.igs,.sldprt,.sldasm,.dwg,.dxf'
  };

  const IN_LABEL = {
    voice:  'پیام صوتی',
    camera: 'عکس دوربین',
    image:  'تصویر قطعه',
    pdf:    'کاتالوگ / سند',
    cad:    'فایل CAD'
  };

  const OUT_LABEL = {
    step:    'فایل STEP',
    drawing: 'نقشه‌ی PDF',
    part:    'فایل پارت SolidWorks',
    render:  'رندر تصویری',
    quote:   'پیش‌فاکتور اکسل'
  };

  function extOf(name) {
    const i = name.lastIndexOf('.');
    return i < 0 ? '' : name.slice(i + 1).toLowerCase();
  }

  function kindOf(file) {
    const e = extOf(file.name);
    if (file.type.startsWith('image/')) return 'image';
    if (['step', 'stp', 'iges', 'igs', 'sldprt', 'sldasm', 'dwg', 'dxf'].includes(e)) return 'cad';
    return 'pdf';
  }

  const ICON_OF = { image: '🖼', cad: '📐', pdf: '📄' };

  function prettySize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  const REPLY_OF = {
    image: 'تصویر را گرفتم. تشخیص نوع قطعه از روی عکس در نسخه‌ی بعدی اضافه می‌شود.',
    cad:   'فایل CAD را گرفتم. بعد از اتصال به موتور، ابعاد و جنس را از خود فایل می‌خوانم.',
    pdf:   'سند را گرفتم. بعداً مشخصات را از جدول‌های داخلش استخراج می‌کنم.'
  };

  const MAX_MB = 25;

  function attachFile(file) {
    if (file.size > MAX_MB * 1024 * 1024) {
      addMsg('فایل «' + file.name + '» بزرگ‌تر از ' + MAX_MB + ' مگابایت است و فعلاً پذیرفته نمی‌شود.');
      return;
    }

    const kind = kindOf(file);
    const name = file.name.replace(/[<>&]/g, '');
    let html = '<span class="attach">' + ICON_OF[kind] + ' ' + name + ' — ' + prettySize(file.size) + '</span>';

    if (kind === 'image') {
      html += '<br><img class="thumb" src="' + URL.createObjectURL(file) + '" alt="' + name + '">';
    } else {
      html += '<br><span class="filecard"><b>' + (extOf(file.name).toUpperCase() || 'FILE')
            + '</b><span>' + IN_LABEL[kind] + '</span></span>';
    }

    addMsg(html, 'me');
    setTimeout(() => addMsg(REPLY_OF[kind]), 750);
  }

  function attachFiles(list) {
    [...list].slice(0, 5).forEach((f, i) => setTimeout(() => attachFile(f), i * 250));
  }

  /* ---------- راهنمای دسترسی ---------- */

  /** پیام راهنمای باز کردن دسترسی را در چت نشان می‌دهد */
  function accessHelp(what, extra) {
    let msg = 'دسترسی به <b>' + what + '</b> بسته است.<br><br>'
            + '<b>برای باز کردن:</b><br>'
            + '۱. روی آیکون 🔒 یا ⓘ کنار آدرس سایت بزنید<br>'
            + '۲. گزینه‌ی «' + what + '» را پیدا کنید<br>'
            + '۳. آن را روی «Allow» بگذارید<br>'
            + '۴. صفحه را رفرش کنید';
    if (extra) msg += '<br><br>' + extra;
    addMsg(msg);
    toast('دسترسی به ' + what + ' داده نشد.');
  }

  /** خطای getUserMedia را به پیام فارسی تبدیل می‌کند */
  function mediaError(err, what) {
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
      accessHelp(what);
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      addMsg(what + 'ی روی این دستگاه پیدا نشد. یکی وصل کنید و صفحه را رفرش کنید.');
    } else if (err.name === 'NotReadableError') {
      addMsg(what + ' در اختیار برنامه‌ی دیگری است. آن برنامه را ببندید و دوباره امتحان کنید.');
    } else {
      addMsg('کار نکرد. (' + err.name + ')');
    }
  }

  /** آیا صفحه روی بستر امن باز شده؟ */
  function secureOk() {
    if (window.isSecureContext) return true;
    addMsg('این قابلیت فقط روی <b>HTTPS</b> یا <b>localhost</b> کار می‌کند. '
         + 'لطفاً سایت را روی آدرس امن باز کنید.');
    return false;
  }

  const fileIn = $('#fileIn');
  const camIn  = $('#camIn');

  $$('.intype').forEach(btn => btn.addEventListener('click', () => {
    const kind = btn.dataset.in;

    if (kind === 'voice')  { toggleRec(btn); return; }
    if (kind === 'camera') { openCamera(); return; }

    // فایل: مرورگر اجازه‌ی جداگانه نمی‌خواهد، ولی اگر باز نشد راهنما بده
    try {
      fileIn.accept = ACCEPT[kind] || '';
      fileIn.multiple = true;
      fileIn.click();
    } catch (err) {
      addMsg('پنجره‌ی انتخاب فایل باز نشد. '
           + 'اگر مرورگر پیام مسدودسازی نشان داد، آن را Allow کنید، '
           + 'یا فایل را مستقیم روی همین پنجره‌ی چت بکشید و رها کنید.');
    }
  }));

  fileIn.addEventListener('change', e => {
    if (e.target.files.length) attachFiles(e.target.files);
    e.target.value = '';
  });

  if (camIn) {
    camIn.addEventListener('change', e => {
      if (e.target.files.length) attachFiles(e.target.files);
      e.target.value = '';
    });
  }

  /** گرفتن عکس با دوربین */
  async function openCamera() {
    // در موبایل، ورودی فایل با capture ساده‌تر و مطمئن‌تر است
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && camIn) { camIn.click(); return; }

    if (!secureOk()) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      addMsg('این مرورگر دوربین را پشتیبانی نمی‌کند. به‌جایش از دکمه‌ی «عکس» استفاده کنید.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();

      // یک فریم بگیر
      await new Promise(r => setTimeout(r, 400));
      const canvas = document.createElement('canvas');
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      stream.getTracks().forEach(t => t.stop());

      canvas.toBlob(blob => {
        const file = new File([blob], 'camera-' + Date.now() + '.jpg', { type: 'image/jpeg' });
        attachFile(file);
      }, 'image/jpeg', 0.9);

    } catch (err) {
      mediaError(err, 'دوربین');
    }
  }

  /* کشیدن و رها کردن */
  const dropZone = $('#chat');

  ['dragenter', 'dragover'].forEach(ev =>
    dropZone.addEventListener(ev, e => { e.preventDefault(); dropZone.dataset.drag = 'true'; })
  );

  ['dragleave', 'drop'].forEach(ev =>
    dropZone.addEventListener(ev, e => {
      e.preventDefault();
      if (ev === 'dragleave' && dropZone.contains(e.relatedTarget)) return;
      dropZone.dataset.drag = 'false';
    })
  );

  dropZone.addEventListener('drop', e => {
    if (e.dataTransfer.files.length) attachFiles(e.dataTransfer.files);
  });

  /* چسباندن از کلیپ‌بورد */
  $('#chatInput').addEventListener('paste', e => {
    const files = [...(e.clipboardData.files || [])];
    if (files.length) { e.preventDefault(); attachFiles(files); }
  });

  /* دکمه‌های خروجی */
  $$('[data-out]').forEach(b => b.addEventListener('click', () => {
    toast(OUT_LABEL[b.dataset.out] + ' — بعد از اتصال به موتور SolidWorks فعال می‌شود.');
  }));

  /* ---------- ضبط صدا ---------- */
  let recorder = null, chunks = [], startedAt = 0;

  window.toggleRec = async function (btn) {
    if (recorder && recorder.state === 'recording') { recorder.stop(); return; }

    if (!secureOk()) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia
        || typeof MediaRecorder === 'undefined') {
      addMsg('این مرورگر ضبط صدا را پشتیبانی نمی‌کند. لطفاً Chrome یا Firefox را امتحان کنید.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
      chunks = [];
      startedAt = Date.now();

      recorder.ondataavailable = e => chunks.push(e.data);

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        btn.dataset.rec = 'false';
        btn.textContent = '🎙 وویس';

        const secs = Math.round((Date.now() - startedAt) / 1000);
        const url  = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }));

        addMsg('<span class="attach">🎙 پیام صوتی — ' + secs + ' ثانیه</span>'
             + '<br><audio controls src="' + url + '"></audio>', 'me');

        setTimeout(() => addMsg('صدا را گرفتم. تبدیل گفتار به متن بعد از اتصال موتور فعال می‌شود.'), 700);
      };

      recorder.start();
      btn.dataset.rec = 'true';
      btn.textContent = '⏹ در حال ضبط…';

    } catch (err) {
      btn.dataset.rec = 'false';
      btn.textContent = '🎙 وویس';
      mediaError(err, 'میکروفون');
    }
  };
});
