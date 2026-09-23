const SESSION_KEY = "suratapp_session";
const AUTH_KEY = "suratapp_auth";
const AUTH_VERSION = 2;
const TEMPLATES_KEY = "suratapp_templates";
const DIRUT_KEY = "suratapp_dirut";
const LETTERS_KEY = "suratapp_letters";
const DUMMY_TEMPLATE_SEED_KEY = "suratapp_dummy_blitar_seeded";
const DUMMY_TEMPLATE_VERSION_KEY = "suratapp_dummy_blitar_version";
let pendingProtectedControl = null;

const DEFAULT_TEMPLATES = [
  {
    key: "konfirmasi_akta",
    nama: "Konfirmasi Keabsahan Kutipan Akta Kelahiran",
    deskripsi: "Surat konfirmasi resmi terkait keabsahan dokumen.",
    template: `<p>Dengan hormat,</p><p>Dengan ini kami menerangkan bahwa kutipan akta kelahiran atas nama <strong>{{nama_pemohon}}</strong>, NIK <strong>{{nik}}</strong>, tanggal lahir <strong>{{tanggal_lahir}}</strong>, telah dikonfirmasi keabsahannya.</p><p>{{keterangan}}</p>`,
    fields: [
      { name: "nama_pemohon", label: "Nama pemohon", type: "text", required: true },
      { name: "nik", label: "NIK", type: "text", required: true },
      { name: "tanggal_lahir", label: "Tanggal lahir", type: "date", required: true },
      { name: "keterangan", label: "Keterangan tambahan", type: "textarea", required: false },
    ],
  },
  {
    key: "surat_keterangan",
    nama: "Surat Keterangan",
    deskripsi: "Template umum untuk kebutuhan keterangan dinas.",
    template: `<p>Dengan ini menerangkan bahwa:</p><p>Nama: <strong>{{nama}}</strong><br>NIK: <strong>{{nik}}</strong></p><p>Yang bersangkutan memerlukan surat ini untuk keperluan <strong>{{keperluan}}</strong>.</p>`,
    fields: [
      { name: "nama", label: "Nama lengkap", type: "text", required: true },
      { name: "nik", label: "NIK", type: "text", required: true },
      { name: "keperluan", label: "Keperluan", type: "textarea", required: true },
    ],
  },
  {
    key: "dummy_keabsahan_akta_blitar",
    nama: "Dummy Surat Dinas - Keabsahan Akta Kelahiran",
    deskripsi: "Contoh surat resmi dengan kop, data akta, zona integritas, dan blok tanda tangan.",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    signature_qr_url: "",
    sample_data: {
      nomor_surat: "B/470.02/1785/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5971/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Kelahiran a.n. EKA FARID SANI",
      tanggal_surat: "2026-09-22",
      nama_pemilik: "EKA FARID SANI",
      tempat_tanggal_lahir: "Blitar, 07 Maret 1993",
      nomor_akta: "429 TAHUN 1993",
      tanggal_akta: "1993-03-09",
      nama_ayah: "Sugiono",
      nama_ibu: "Hani'ah",
      keterangan: "",
      nama_penandatangan: "Dina Widyaningtyas Winarni, SE., MM",
      pangkat_penandatangan: "Pembina, (IV/a)",
      nip_penandatangan: "197311032003122002",
    },
    template: `<div class="official-letter">
  <div class="official-meta">
    <div class="official-reference"><div>Nomor<span>:</span> {{nomor_surat}}</div><div>Sifat<span>:</span> {{sifat_surat}}</div><div>Lampiran<span>:</span> {{lampiran}}</div><div>Hal<span>:</span> <strong>{{perihal}}</strong></div></div>
    <div class="official-date">Blitar, {{tanggal_surat}}</div>
  </div>
  <div class="official-recipient">Yth. Kepala Dinas Kependudukan dan<br>Pencatatan Sipil Kabupaten Tuban<br>di<br><strong><u>TUBAN</u></strong></div>
  <p>Dengan hormat,</p>
  <p>Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p>
  <div class="official-details"><div>Nama<span>:</span> <strong>{{nama_pemilik}}</strong></div><div>Tempat, Tanggal Lahir<span>:</span> {{tempat_tanggal_lahir}}</div><div>No. Akta Kelahiran<span>:</span> <strong>{{nomor_akta}}</strong></div><div>Tgl. Akta Kelahiran<span>:</span> {{tanggal_akta}}</div><div>Nama Ayah<span>:</span> {{nama_ayah}}</div><div>Nama Ibu<span>:</span> {{nama_ibu}}</div></div>
  <p>Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Kelahiran tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Blitar, untuk selanjutnya bisa diproses sesuai asas domisili.</p>
  <p>{{keterangan}}</p>
  <p>Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Blitar tidak dipungut biaya apapun (<strong>GRATIS Rp 0.,</strong>).</p>
  <p>Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p>
  <div class="official-signature">a.n. Kepala Dinas Kependudukan dan<br>Pencatatan Sipil<br>Kepala Bidang Pelayanan Pencatatan Sipil,<img class="official-qr" alt="QR tanda tangan elektronik"><div class="signature-space"></div><strong><u>{{nama_penandatangan}}</u></strong><br>{{pangkat_penandatangan}}<br>NIP. {{nip_penandatangan}}</div>
  <div class="official-footer">Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat digital BSrE.</div>
</div>`,
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "nomor_akta", label: "Nomor akta", type: "text", required: true },
      { name: "nama_pemilik", label: "Nama pemilik akta", type: "text", required: true },
      { name: "tempat_tanggal_lahir", label: "Tempat, tanggal lahir", type: "text", required: true },
      { name: "nama_ayah", label: "Nama ayah", type: "text", required: true },
      { name: "nama_ibu", label: "Nama ibu", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta kelahiran", type: "date", required: true },
      { name: "keterangan", label: "Keterangan tambahan", type: "textarea", required: false },
      { name: "nama_penandatangan", label: "Nama penandatangan", type: "text", required: true },
      { name: "pangkat_penandatangan", label: "Pangkat / golongan", type: "text", required: true },
      { name: "nip_penandatangan", label: "NIP penandatangan", type: "text", required: true },
    ],
  },
];

const DEFAULT_DIRUT = [
  {
    id: "dirut-001",
    nama: "Budi Santoso",
    jabatan: "Direktur Utama",
    nip: "19850101 201001 1 001",
  },
  {
    id: "dirut-002",
    nama: "Siti Rahmawati",
    jabatan: "Direktur Operasional",
    nip: "19870312 201203 2 002",
  },
];

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function patchSession(values) {
  const session = { ...getSession(), ...values };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getAuth() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    return auth && typeof auth === "object" && auth.version === AUTH_VERSION && String(auth.username || "").trim() ? auth : null;
  } catch (error) {
    return null;
  }
}

function setAuth(user) {
  const auth = { ...user, version: AUTH_VERSION };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  return auth;
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

function isLoginPage() {
  return location.pathname.endsWith("/login.html");
}

function showLoginModal() {
  if (isLoginPage() || getAuth() || document.getElementById("auth-modal")) return;

  const modal = document.createElement("div");
  modal.id = "auth-modal";
  modal.className = "auth-modal";
  modal.innerHTML = `
    <div class="auth-modal-backdrop"></div>
    <section class="auth-modal-panel" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div class="auth-modal-logo" aria-hidden="true"></div>
      <div class="preview-eyebrow">Akses petugas</div>
      <h2 id="auth-modal-title">Silakan masuk dulu</h2>
      <p>Login diperlukan sebelum Anda dapat memakai fitur Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban.</p>
      <form id="auth-modal-form" class="auth-form">
        <div class="field">
          <label for="auth-modal-username">Nama pengguna</label>
          <input id="auth-modal-username" name="username" type="text" autocomplete="username" required>
        </div>
        <div class="field">
          <label for="auth-modal-password">Kata sandi</label>
          <input id="auth-modal-password" name="password" type="password" autocomplete="current-password" required>
        </div>
        <p id="auth-modal-error" class="auth-error" role="alert"></p>
        <button type="submit" class="btn btn-primary">Masuk</button>
      </form>
    </section>
  `;
  document.body.appendChild(modal);

  modal.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const username = String(values.get("username") || "").trim();
    const password = String(values.get("password") || "");
    const error = modal.querySelector(".auth-error");

    if (username !== "admin" || password !== "12345678") {
      error.textContent = "Nama pengguna atau kata sandi belum sesuai.";
      return;
    }

    setAuth({ username, nama: "Admin Surat" });
    modal.remove();
    const control = pendingProtectedControl;
    pendingProtectedControl = null;
    if (control && control.isConnected) {
      if (control.matches("button[type=submit]")) {
        control.form?.requestSubmit(control);
      } else {
        control.click();
      }
    }
  });

  modal.querySelector("input").focus();
}

function protectPage() {
  if (isLoginPage()) return;
  document.addEventListener("click", (event) => {
    if (getAuth() || event.target.closest("#auth-modal")) return;
    const control = event.target.closest("a, button, input, textarea, select, summary");
    if (!control) return;
    event.preventDefault();
    event.stopPropagation();
    pendingProtectedControl = control;
    showLoginModal();
  }, true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", protectPage, { once: true });
} else {
  protectPage();
}

function setTemplates(templates) {
  const normalized = Array.isArray(templates) ? templates.map(normalizeTemplate) : [];
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(normalized));
  return normalized;
}

function normalizeTemplate(template) {
  const safeTemplate = template || {};
  const fields = Array.isArray(safeTemplate.fields)
    ? safeTemplate.fields.map((field, index) => ({
        name: String(field?.name || `field_${index + 1}`),
        label: String(field?.label || "Field baru"),
        type: String(field?.type || "text"),
        required: Boolean(field?.required),
        options: Array.isArray(field?.options) ? field.options : undefined,
        categories: Array.isArray(field?.categories) ? field.categories.map((category) => ({ name: String(category?.name || ""), options: Array.isArray(category?.options) ? category.options.map(String) : [] })).filter((category) => category.name) : undefined,
      }))
    : [];

  const renderedTemplate = plainTextToHtml(String(safeTemplate.template || "<p>Isi template surat.</p>"));

  return {
    key: String(safeTemplate.key || slugify(safeTemplate.nama || "template_baru")),
    nama: String(safeTemplate.nama || "Template Baru"),
    deskripsi: String(safeTemplate.deskripsi || "Template surat resmi."),
    logo_url: String(safeTemplate.logo_url || ""),
    signature_qr_url: String(safeTemplate.signature_qr_url || ""),
    sample_data: safeTemplate.sample_data && typeof safeTemplate.sample_data === "object" ? { ...safeTemplate.sample_data } : {},
    template: renderedTemplate,
    fields,
    updated_at: safeTemplate.updated_at || new Date().toISOString(),
  };
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^_+|_+$/g, "") || "template_baru";
}

function getTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY));
    const deduped = Array.isArray(saved)
      ? saved.reduce((result, item) => {
          const normalized = normalizeTemplate(item);
          if (!result.some((template) => template.key === normalized.key)) {
            result.push(normalized);
          }
          return result;
        }, [])
      : [];

    let templates = deduped.length ? deduped : DEFAULT_TEMPLATES;
    const seededDummy = DEFAULT_TEMPLATES.find((template) => template.key === "dummy_keabsahan_akta_blitar");
    if (seededDummy && localStorage.getItem(DUMMY_TEMPLATE_VERSION_KEY) !== "4") {
      const dummyIndex = templates.findIndex((template) => template.key === seededDummy.key);
      templates = dummyIndex >= 0
        ? templates.map((template, index) => index === dummyIndex ? seededDummy : template)
        : [...templates, seededDummy];
      localStorage.setItem(DUMMY_TEMPLATE_SEED_KEY, "1");
      localStorage.setItem(DUMMY_TEMPLATE_VERSION_KEY, "4");
    }

    const normalized = setTemplates(templates);
    return normalized;
  } catch (error) {
    return setTemplates(DEFAULT_TEMPLATES);
  }
}

function upsertTemplate(template) {
  const templates = getTemplates();
  const normalized = normalizeTemplate(template);
  const existingIndex = templates.findIndex((item) => item.key === normalized.key);
  const savedTemplate = {
    ...normalized,
    updated_at: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    templates[existingIndex] = { ...templates[existingIndex], ...savedTemplate };
  } else {
    templates.unshift(savedTemplate);
  }

  setTemplates(templates);
  return savedTemplate;
}

function deleteTemplate(templateKey) {
  const templates = getTemplates();
  if (!templateKey || templates.length <= 1) {
    return templates;
  }

  const next = templates.filter((template) => template.key !== templateKey);
  return setTemplates(next);
}

function buildTemplatePreview(template) {
  const safeTemplate = normalizeTemplate(template);
  const sampleData = {};

  (safeTemplate.fields || []).forEach((field) => {
    const name = String(field.name || "field");
    if (field.type === "date") {
      sampleData[name] = "2026-09-21";
    } else if (field.type === "textarea") {
      sampleData[name] = `Contoh ${field.label || "isi"} untuk preview.`;
    } else {
      sampleData[name] = `Contoh ${field.label || name}`;
    }
  });

  return renderTemplate(safeTemplate.template, sampleData);
}

function getDirut() {
  try {
    const saved = JSON.parse(localStorage.getItem(DIRUT_KEY));
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_DIRUT;
  } catch (error) {
    return DEFAULT_DIRUT;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function htmlToPlainText(value) {
  const raw = String(value || "");
  if (!raw) return "";
  const withoutTags = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, "\n").replace(/<[^>]+>/g, "");
  return withoutTags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function plainTextToHtml(value) {
  const raw = String(value || "").trim();
  if (!raw) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }

  const tokens = [];
  const withTokens = raw.replace(/{{\s*([\w-]+)\s*}}/g, (match) => {
    const token = `__SURAT_TOKEN_${tokens.length}__`;
    tokens.push(match);
    return token;
  });

  const paragraphs = withTokens
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const safeParagraph = escapeHtml(paragraph).replace(/__SURAT_TOKEN_(\d+)__/g, (_, index) => tokens[Number(index)]);
      return `<p>${safeParagraph.replace(/\n/g, "<br>")}</p>`;
    });

  return paragraphs.join("") || "<p></p>";
}

function renderTemplate(template, data) {
  return String(template || "").replace(/{{\s*([\w-]+)\s*}}/g, (match, key) => escapeHtml(data[key] || ""));
}

function getLetters() {
  try {
    const saved = JSON.parse(localStorage.getItem(LETTERS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function getNextLetterId(letters) {
  const highestId = letters.reduce((highest, letter) => {
    const value = Number(String(letter?.id || "").replace(/^L/, ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return `L${String(highestId + 1).padStart(3, "0")}`;
}

function upsertLetter(letter) {
  const letters = getLetters();
  const now = new Date().toISOString();
  const existingIndex = letter?.id ? letters.findIndex((item) => item.id === letter.id) : -1;
  const savedLetter = {
    ...letter,
    id: existingIndex >= 0 ? letters[existingIndex].id : (letter?.id || getNextLetterId(letters)),
    created_at: existingIndex >= 0 ? letters[existingIndex].created_at : now,
    updated_at: now,
  };

  if (existingIndex >= 0) {
    letters[existingIndex] = savedLetter;
  } else {
    letters.unshift(savedLetter);
  }

  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  return savedLetter;
}

function deleteLetter(letterId) {
  if (!letterId) return getLetters();
  const letters = getLetters().filter((letter) => letter.id !== letterId);
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  return letters;
}

function saveLetter(letter) {
  return upsertLetter(letter);
}
