(function () {
  /* =========================================================
     EDIT.JS — Builder Template
     - Setiap field bisa ganti jenis: Teks / Tanggal / Paragraf / Kategori
     - Field kategori punya daftar pilihan sendiri
     - Sisipkan data ke Isi Surat lewat modal (multi-pilih per grup)
     - Baris "label : nilai" otomatis jadi tabel rapi
     - Hal surat: dropdown + opsi "Lainnya (ketik sendiri)"
     - QR TTE bisa dihapus
     - Tanggal di kanan atas, terpisah di atas Nomor
     - Penandatangan sinkron dengan getDirut()
     ========================================================= */

  const params = new URLSearchParams(window.location.search);
  const templateKey = params.get("key");
  const templates = getTemplates();
  const existing = templates.find((item) => item.key === templateKey) || null;

  const preview = document.getElementById("template-preview");
  const paper = document.getElementById("paper");
  const paperScale = document.getElementById("paper-scale");
  const viewport = document.getElementById("paper-viewport");
  const status = document.getElementById("status");
  const fieldList = document.getElementById("field-list");
  const byId = (id) => document.getElementById(id);

  const BLOCK_ORDER = ["kop", "identitas", "tujuan", "isi", "ttd"];

  const PAPER_SIZES = {
    a4: { w: 210, h: 297 },
    f4: { w: 215, h: 330 },
    letter: { w: 216, h: 279 }
  };
  const MM_TO_PX = 3.7795;

  const FIELD_TYPES = [
    { value: "text", label: "Teks Pendek" },
    { value: "date", label: "Tanggal" },
    { value: "textarea", label: "Paragraf Panjang" },
    { value: "category", label: "Kategori (Dropdown Pilihan)" }
  ];

  // =========================================================
  // STATE
  // =========================================================
  const state = {
    kop: {
      enabled: existing?.blocks?.kop?.enabled ?? false,
      mode: existing?.blocks?.kop?.mode || "terstruktur",
      instansi: existing?.blocks?.kop?.instansi || "PEMERINTAH KABUPATEN TUBAN",
      dinas: existing?.blocks?.kop?.dinas || "DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL",
      alamat: existing?.blocks?.kop?.alamat || "Jl. Raya Tuban No. 123 · Telp. (0356) 12345",
      line: existing?.blocks?.kop?.line || "medium",
      logoUrl: existing?.blocks?.kop?.logoUrl || existing?.logo_url || "",
      fotoUrl: existing?.blocks?.kop?.fotoUrl || existing?.kop_foto_url || ""
    },
    identitas: {
      enabled: existing?.blocks?.identitas?.enabled ?? false,
      nomor: existing?.blocks?.identitas?.nomor || "",
      sifat: existing?.blocks?.identitas?.sifat || "Biasa",
      lampiran: existing?.blocks?.identitas?.lampiran || "-",
      hal: existing?.blocks?.identitas?.hal || "",
      tanggal: existing?.blocks?.identitas?.tanggal || ""
    },
    tujuan: {
      enabled: existing?.blocks?.tujuan?.enabled ?? false,
      y1: existing?.blocks?.tujuan?.y1 || "",
      y2: existing?.blocks?.tujuan?.y2 || "",
      di: existing?.blocks?.tujuan?.di || ""
    },
    isi: {
      enabled: existing?.blocks?.isi?.enabled ?? false,
      text: existing?.blocks?.isi?.text || "",
      align: existing?.blocks?.isi?.align || "justify"
    },
    ttd: {
      enabled: existing?.blocks?.ttd?.enabled ?? false,
      pejabatId: existing?.blocks?.ttd?.pejabatId || "",
      posisi: existing?.blocks?.ttd?.posisi || "kanan",
      qrUrl: existing?.signature_qr_url || ""
    }
  };

  let fields = (existing?.fields?.length ? existing.fields : []).map((f) => ({
    label: f.label || "",
    name: f.name || slugify(f.label || ""),
    type: f.type || "text",
    required: Boolean(f.required),
    sample: f.sample || "",
    options: Array.isArray(f.options) ? [...f.options] : [],
  }));

  const DUMMY = {
    nomor_surat: "B/470.02/1234/409.20.3/2026",
    perihal: "Jawaban Keabsahan Akta Kelahiran",
    tanggal_surat: "Tuban, 22 September 2026",
    tujuan_1: "Kepala Dinas Kependudukan dan Pencatatan Sipil",
    tujuan_2: "Kabupaten Tuban",
    tujuan_kota: "TUBAN"
  };

  // =========================================================
  // HAL SURAT — dropdown + custom
  // =========================================================
  function updateHalInput() {
    const sel = byId("id-hal-select");
    const inp = byId("id-hal");
    if (!sel || !inp) return;
    const v = sel.value;
    if (v === "__custom__") {
      inp.style.display = "";
      inp.focus();
      state.identitas.hal = inp.value;
    } else {
      inp.style.display = "none";
      state.identitas.hal = v || "";
      inp.value = v || "";
    }
  }

  // =========================================================
  // INIT
  // =========================================================
  function init() {
    byId("template-key").value = existing?.key || "";
    byId("template-nama").value = existing?.nama || "";
    byId("template-deskripsi").value = existing?.deskripsi || "";

    byId("kop-mode").value = state.kop.mode;
    toggleKopMode();
    byId("kop-instansi").value = state.kop.instansi;
    byId("kop-dinas").value = state.kop.dinas;
    byId("kop-alamat").value = state.kop.alamat;
    byId("kop-garis").value = state.kop.line;
    if (state.kop.logoUrl) {
      byId("kop-logo-prev").src = state.kop.logoUrl;
      byId("kop-logo-prev").hidden = false;
    }
    if (state.kop.fotoUrl) {
      byId("kop-foto-prev").src = state.kop.fotoUrl;
      byId("kop-foto-prev").hidden = false;
    }

    byId("id-nomor").value = state.identitas.nomor;
    byId("id-sifat").value = state.identitas.sifat;
    byId("id-lampiran").value = state.identitas.lampiran;

    (function initHalField() {
      const sel = byId("id-hal-select");
      const inp = byId("id-hal");
      const current = state.identitas.hal || "";
      const hasOption = [...sel.options].some((o) => o.value === current);
      if (current && !hasOption) {
        sel.value = "__custom__";
        inp.value = current;
        inp.style.display = "";
      } else {
        sel.value = current;
        inp.value = current;
        inp.style.display = "none";
      }
    })();

    byId("id-tanggal").value = state.identitas.tanggal;

    byId("yth-1").value = state.tujuan.y1;
    byId("yth-2").value = state.tujuan.y2;
    byId("yth-di").value = state.tujuan.di;

    byId("isi-text").value = state.isi.text;
    byId("isi-align").value = state.isi.align;

    fillPejabatOptions();
    byId("ttd-posisi").value = state.ttd.posisi;

    if (state.ttd.qrUrl) {
      byId("ttd-qr-prev").src = state.ttd.qrUrl;
      const wrap = byId("ttd-qr-wrap");
      if (wrap) wrap.hidden = false;
      else byId("ttd-qr-prev").hidden = false;
    } else {
      const wrap = byId("ttd-qr-wrap");
      if (wrap) wrap.hidden = true;
    }

    BLOCK_ORDER.forEach((k) => {
      const chk = document.querySelector(`[data-toggle="${k}"]`);
      if (chk) chk.checked = state[k].enabled;
    });

    renderFields();
    renderPreview();
    applyPaperSize();
    applyZoom();
    setTimeout(() => {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
    }, 80);
  }

  // =========================================================
  // ISI DROPDOWN PEJABAT
  // =========================================================
  function fillPejabatOptions() {
    const select = byId("ttd-pejabat");
    if (!select) return;
    const list = getDirut();
    select.innerHTML = '<option value="">-- Pilih --</option>' +
      list.map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.nama)} — ${escapeHtml(s.jabatan)}</option>`).join("");

    const exists = list.some((s) => s.id === state.ttd.pejabatId);
    if (!exists) {
      state.ttd.pejabatId = list[0]?.id || "";
    }
    select.value = state.ttd.pejabatId || "";
  }

  // =========================================================
  // TOGGLE MODE KOP
  // =========================================================
  function toggleKopMode() {
    const mode = state.kop.mode;
    byId("kop-terstruktur-fields").style.display = mode === "terstruktur" ? "" : "none";
    byId("kop-foto-fields").style.display = mode === "foto" ? "" : "none";
  }

  byId("kop-mode").addEventListener("change", () => {
    state.kop.mode = byId("kop-mode").value;
    toggleKopMode();
    renderPreview();
  });

  // =========================================================
  // BIND INPUT
  // =========================================================
  function bindInput(id, path, isNumber = false) {
    const el = byId(id);
    if (!el) return;
    const handler = () => {
      const keys = path.split(".");
      let obj = state;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = isNumber ? Number(el.value) : el.value;
      renderPreview();
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  }

  bindInput("kop-instansi", "kop.instansi");
  bindInput("kop-dinas", "kop.dinas");
  bindInput("kop-alamat", "kop.alamat");
  bindInput("kop-garis", "kop.line");
  bindInput("id-nomor", "identitas.nomor");
  bindInput("id-sifat", "identitas.sifat");
  bindInput("id-lampiran", "identitas.lampiran");
  bindInput("id-tanggal", "identitas.tanggal");
  bindInput("yth-1", "tujuan.y1");
  bindInput("yth-2", "tujuan.y2");
  bindInput("yth-di", "tujuan.di");
  bindInput("isi-text", "isi.text");
  bindInput("isi-align", "isi.align");
  bindInput("ttd-pejabat", "ttd.pejabatId");
  bindInput("ttd-posisi", "ttd.posisi");

  // ===== Hal: dropdown + input custom =====
  const halSelect = byId("id-hal-select");
  if (halSelect) {
    halSelect.addEventListener("change", () => {
      updateHalInput();
      renderPreview();
    });
  }
  const halInput = byId("id-hal");
  if (halInput) {
    halInput.addEventListener("input", () => {
      state.identitas.hal = halInput.value;
      renderPreview();
    });
  }

  document.querySelectorAll("[data-toggle]").forEach((chk) => {
    chk.addEventListener("change", () => {
      state[chk.dataset.toggle].enabled = chk.checked;
      renderPreview();
    });
  });

  byId("kop-logo").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      state.kop.logoUrl = String(r.result || "");
      byId("kop-logo-prev").src = state.kop.logoUrl;
      byId("kop-logo-prev").hidden = false;
      renderPreview();
    };
    r.readAsDataURL(f);
  });

  byId("kop-foto").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      state.kop.fotoUrl = String(r.result || "");
      byId("kop-foto-prev").src = state.kop.fotoUrl;
      byId("kop-foto-prev").hidden = false;
      renderPreview();
    };
    r.readAsDataURL(f);
  });

  byId("ttd-qr").addEventListener("change", (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      state.ttd.qrUrl = String(r.result || "");
      byId("ttd-qr-prev").src = state.ttd.qrUrl;
      const wrap = byId("ttd-qr-wrap");
      if (wrap) wrap.hidden = false;
      else byId("ttd-qr-prev").hidden = false;
      renderPreview();
    };
    r.readAsDataURL(f);
  });

  const qrHapusBtn = byId("ttd-qr-hapus");
  if (qrHapusBtn) {
    qrHapusBtn.addEventListener("click", () => {
      state.ttd.qrUrl = "";
      byId("ttd-qr").value = "";
      byId("ttd-qr-prev").src = "";
      const wrap = byId("ttd-qr-wrap");
      if (wrap) wrap.hidden = true;
      else byId("ttd-qr-prev").hidden = true;
      renderPreview();
    });
  }

  // =========================================================
  // SISIPKAN DATA KE ISI SURAT (modal multi-pilih)
  // =========================================================
  let lastIsiSelection = { start: null, end: null };

  function rememberIsiSelection() {
    const ta = byId("isi-text");
    if (!ta) return;
    lastIsiSelection.start = ta.selectionStart;
    lastIsiSelection.end = ta.selectionEnd;
  }

  function insertIntoIsi(text) {
    const ta = byId("isi-text");
    if (!ta) return;

    const value = ta.value;
    let start = lastIsiSelection.start;
    let end = lastIsiSelection.end;

    if (start === null || end === null) {
      start = value.length;
      end = value.length;
    }

    start = Math.min(Math.max(0, start), value.length);
    end = Math.min(Math.max(start, end), value.length);

    ta.value = value.slice(0, start) + text + value.slice(end);
    const pos = start + text.length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    lastIsiSelection.start = pos;
    lastIsiSelection.end = pos;
    state.isi.text = ta.value;
    renderPreview();
  }

  function renderPickModal() {
    const listEl = byId("pick-fields-list");
    const emptyEl = byId("pick-fields-empty");
    if (!listEl) return;

    const usable = fields
      .map((f, i) => ({ ...f, index: i }))
      .filter((f) => f.name && f.label);

    emptyEl.hidden = usable.length > 0;

    if (!usable.length) {
      listEl.innerHTML = "";
      return;
    }

    const groups = {
      text:     { label: "Teks Pendek",      items: [] },
      date:     { label: "Tanggal",          items: [] },
      textarea: { label: "Paragraf Panjang", items: [] },
      category: { label: "Kategori",         items: [] },
    };

    usable.forEach((f) => {
      const g = groups[f.type] || groups.text;
      g.items.push(f);
    });

    listEl.innerHTML = Object.values(groups)
      .filter((g) => g.items.length)
      .map((g) => `
        <div class="pick-group">
          <div class="pick-group-title">${g.label}</div>
          ${g.items.map((item) => `
            <label class="pick-item">
              <input type="checkbox" value="${escapeHtml(item.name)}">
              <span class="pick-item-label">
                <strong>${escapeHtml(item.label)}</strong>
                <code>{{${escapeHtml(item.name)}}}</code>
              </span>
            </label>
          `).join("")}
        </div>
      `).join("");
  }

  function openPickModal() {
    renderPickModal();
    byId("pick-fields-modal").hidden = false;
  }

  function closePickModal() {
    byId("pick-fields-modal").hidden = true;
    byId("pick-fields-modal").querySelectorAll('input[type="checkbox"]').forEach((c) => c.checked = false);
  }

  function applyPickInsert() {
    const modal = byId("pick-fields-modal");
    const checked = [...modal.querySelectorAll('input[type="checkbox"]:checked')];
    if (!checked.length) {
      alert("Pilih minimal satu data.");
      return;
    }

    const tokens = checked.map((cb) => `{{${cb.value}}}`).join(" ");
    insertIntoIsi(tokens);
    closePickModal();
    setStatus("Data disisipkan ke Isi Surat.", false);
  }

  // =========================================================
  // RENDER PREVIEW
  // =========================================================
  function renderPreview() {
    const html = BLOCK_ORDER
      .filter((k) => state[k].enabled)
      .map((k) => buildBlockHtml(k))
      .join("");

    const sample = buildSampleData();
    preview.innerHTML = (typeof renderTemplate === "function")
      ? renderTemplate(html, sample)
      : html;
  }

  function buildSampleData() {
    const data = { ...DUMMY };
    if (state.identitas.nomor) data.nomor_surat = state.identitas.nomor;
    if (state.identitas.hal) data.perihal = state.identitas.hal;
    if (state.identitas.tanggal) data.tanggal_surat = state.identitas.tanggal;
    if (state.tujuan.y1) data.tujuan_1 = state.tujuan.y1;
    if (state.tujuan.y2) data.tujuan_2 = state.tujuan.y2;
    if (state.tujuan.di) data.tujuan_kota = state.tujuan.di;

    fields.forEach((f) => {
      if (f.sample && f.sample.trim()) {
        data[f.name] = f.sample;
      } else if (f.type === "date") {
        data[f.name] = "22 September 2026";
      } else if (f.type === "category") {
        data[f.name] = Array.isArray(f.options) && f.options.length ? f.options[0] : "— pilih —";
      } else {
        data[f.name] = "_____________________";
      }
    });
    return data;
  }

  // =========================================================
  // BUILD HTML
  // =========================================================
  function buildBlockHtml(key) {
    switch (key) {
      case "kop": {
        const s = state.kop;
        if (s.mode === "foto") {
          if (!s.fotoUrl) return `<div class="blok-kop-foto"><p class="isi-empty">(Belum upload foto kop)</p></div>`;
          return `<div class="blok-kop-foto"><img src="${s.fotoUrl}" alt="Kop Surat"></div>`;
        }
        const logoSrc = s.logoUrl || "Lambang_Kabupaten_Tuban.webp";
        return `
          <table class="blok-kop">
            <tr>
              <td class="kop-logo"><img src="${logoSrc}" alt="Logo" onerror="this.style.visibility='hidden'"></td>
              <td class="kop-teks">
                <div class="kop-instansi">${escapeHtml(s.instansi || "—")}</div>
                <div class="kop-dinas">${escapeHtml(s.dinas || "—")}</div>
                <div class="kop-alamat">${escapeHtml(s.alamat || "—")}</div>
              </td>
            </tr>
          </table>
          <div class="kop-garis garis-${s.line}"></div>`;
      }

      case "identitas": {
        const s = state.identitas;
        const nomor = s.nomor || "{{nomor_surat}}";
        const hal = s.hal || "{{perihal}}";
        const tanggal = s.tanggal || "";
        return `
          <div class="blok-identitas">
            ${tanggal ? `<div class="id-tanggal-atas">${escapeHtml(tanggal)}</div>` : ""}
            <table class="id-table">
              <tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>${escapeHtml(nomor)}</td></tr>
              <tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>${escapeHtml(s.sifat || "-")}</td></tr>
              <tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>${escapeHtml(s.lampiran || "-")}</td></tr>
              <tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>${escapeHtml(hal)}</td></tr>
            </table>
          </div>`;
      }

      case "tujuan": {
        const s = state.tujuan;
        const y1 = s.y1 || "{{tujuan_1}}";
        const y2 = s.y2 || "{{tujuan_2}}";
        const di = (s.di || "{{tujuan_kota}}").toUpperCase();
        return `
          <div class="blok-tujuan">
            <div>Yth. ${escapeHtml(y1)}</div>
            <div class="tujuan-2">${escapeHtml(y2)}</div>
            <div>di</div>
            <div class="tujuan-kota">${escapeHtml(di)}</div>
          </div>`;
      }

      case "isi": {
        const s = state.isi;
        if (!s.text.trim()) return `<div class="blok-isi"><p class="isi-empty">(Isi surat belum ditulis)</p></div>`;

        const paras = s.text.split(/\n\s*\n/).map((block) => {
          const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
          if (!lines.length) return "";

          const out = [];
          let listBuffer = [];

          const flushList = () => {
            if (!listBuffer.length) return;
            out.push(
              `<div class="blok-data-list">${
                listBuffer.map(({ label, value }) =>
                  `<div class="data-row"><span class="data-label">${label}</span><span class="data-colon">:</span><span class="data-value">${value}</span></div>`
                ).join("")
              }</div>`
            );
            listBuffer = [];
          };

          lines.forEach((line) => {
            const m = line.match(/^(.+?)\s*:\s*(.+)$/);
            if (m) {
              listBuffer.push({
                label: escapeHtml(m[1].trim()),
                value: escapeHtml(m[2].trim()),
              });
            } else {
              flushList();
              out.push(`<p class="isi-${s.align}">${escapeHtml(line)}</p>`);
            }
          });

          flushList();
          return out.join("");
        }).join("");

        return `<div class="blok-isi">${paras}</div>`;
      }

      case "ttd": {
        const s = state.ttd;
        if (!s.pejabatId) {
          return `<div class="blok-ttd blok-ttd-${s.posisi}"><p class="isi-empty">(Pilih pejabat penandatangan)</p></div>`;
        }
        const d = getDirut().find((item) => item.id === s.pejabatId);
        if (!d) {
          return `<div class="blok-ttd blok-ttd-${s.posisi}"><p class="isi-empty">(Pejabat tidak ditemukan — pilih ulang di panel kiri)</p></div>`;
        }
        const qrHtml = s.qrUrl
          ? `<img src="${s.qrUrl}" class="ttd-qr" alt="QR">`
          : `<div class="ttd-space-dummy"></div>`;
        return `
          <div class="blok-ttd blok-ttd-${s.posisi}">
            <div class="ttd-jabatan">${escapeHtml(d.jabatan || "")},</div>
            <div class="ttd-qr-wrap">${qrHtml}</div>
            <div class="ttd-nama">${escapeHtml(d.nama || "")}</div>
            <div class="ttd-pangkat">${escapeHtml(d.pangkat || "")}</div>
            <div class="ttd-nip">${d.nip ? "NIP. " + escapeHtml(d.nip) : ""}</div>
          </div>`;
      }
    }
    return "";
  }

  // =========================================================
  // FIELD LIST — dropdown jenis + kategori
  // =========================================================
  function renderFields() {
    fieldList.innerHTML = fields.map((f, i) => {
      const type = f.type || "text";
      const isCategory = type === "category";
      const optionsText = Array.isArray(f.options) ? f.options.join("\n") : "";
      const typeOptions = FIELD_TYPES.map((t) =>
        `<option value="${t.value}"${t.value === type ? " selected" : ""}>${t.label}</option>`
      ).join("");

      return `
        <div class="field-card" data-idx="${i}">
          <div class="field-card-top">
            <strong>Data ${i + 1}</strong>
            <button type="button" class="remove-field" data-remove="${i}">× Hapus</button>
          </div>

          <div class="ctrl-field">
            <label>Pertanyaan</label>
            <input data-fk="label" data-fi="${i}" value="${escapeHtml(f.label || "")}" placeholder="Contoh: Nama Pemohon">
          </div>

          <div class="ctrl-field">
            <label>Jenis Data</label>
            <select data-fk="type" data-fi="${i}">${typeOptions}</select>
          </div>

          ${isCategory ? `
            <div class="ctrl-field">
              <label>Daftar Pilihan <span style="opacity:.6;font-weight:400">(satu per baris)</span></label>
              <textarea data-fk="optionsText" data-fi="${i}" rows="4" placeholder="Contoh:&#10;Kartu Keluarga&#10;KTP Elektronik&#10;Akta Kelahiran">${escapeHtml(optionsText)}</textarea>
            </div>
          ` : ""}

          <div class="ctrl-field">
            <label>Contoh Isi <span style="opacity:.6;font-weight:400">(untuk preview)</span></label>
            <input data-fk="sample" data-fi="${i}" value="${escapeHtml(f.sample || "")}" placeholder="${isCategory ? "Kosongkan = pakai pilihan pertama" : "Contoh: Eka Farid Sani"}">
          </div>

          <label class="required-toggle">
            <input type="checkbox" data-fk="required" data-fi="${i}" ${f.required ? "checked" : ""}> Wajib diisi staf
          </label>
        </div>
      `;
    }).join("");

    fieldList.querySelectorAll("[data-fk]").forEach((el) => {
      el.addEventListener("input", updateFieldFromEl);
      el.addEventListener("change", updateFieldFromEl);
    });
    fieldList.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        fields.splice(Number(btn.dataset.remove), 1);
        renderFields();
        renderPreview();
      });
    });
  }

  function updateFieldFromEl(e) {
    const i = Number(e.target.dataset.fi);
    const key = e.target.dataset.fk;
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;

    if (key === "optionsText") {
      fields[i].options = String(val).split("\n").map((s) => s.trim()).filter(Boolean);
    } else if (key === "type") {
      fields[i].type = val;
      if (val === "category" && !Array.isArray(fields[i].options)) {
        fields[i].options = [];
      }
      renderFields();
    } else {
      fields[i][key] = val;
    }

    if (key === "label") fields[i].name = slugify(fields[i].label || `field_${i + 1}`);
    renderPreview();
  }

  function addField(type) {
    const n = fields.length + 1;
    fields.push({
      label: `Data ${n}`,
      name: slugify(`Data ${n}`),
      type: type || "text",
      required: false,
      sample: "",
      options: [],
    });
    renderFields();
    renderPreview();
  }

  byId("add-text").addEventListener("click", () => addField("text"));
  byId("add-date").addEventListener("click", () => addField("date"));
  byId("add-long").addEventListener("click", () => addField("textarea"));
  const addCat = byId("add-cat");
  if (addCat) addCat.addEventListener("click", () => addField("category"));

  // =========================================================
  // LISTENER MODAL SISIPKAN + KURSOR ISI SURAT
  // =========================================================
  const isiTextEl = byId("isi-text");
  if (isiTextEl) {
    ["click", "keyup", "mouseup", "input", "focus"].forEach((evt) => {
      isiTextEl.addEventListener(evt, rememberIsiSelection);
    });
  }

  const btnInsert = byId("btn-insert-field");
  if (btnInsert) btnInsert.addEventListener("click", openPickModal);

  const pickModal = byId("pick-fields-modal");
  if (pickModal) {
    pickModal.querySelectorAll("[data-close-pick]").forEach((el) => {
      el.addEventListener("click", closePickModal);
    });
  }

  const btnPickInsert = byId("pick-insert-btn");
  if (btnPickInsert) btnPickInsert.addEventListener("click", applyPickInsert);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = byId("pick-fields-modal");
      if (modal && !modal.hidden) closePickModal();
    }
  });

  // =========================================================
  // UKURAN & MARGIN
  // =========================================================
  function applyPaperSize() {
    const size = PAPER_SIZES[byId("paper-size").value] || PAPER_SIZES.a4;
    paper.style.width = (size.w * MM_TO_PX) + "px";
    paper.style.minHeight = (size.h * MM_TO_PX) + "px";
    applyMargin();
  }
  function applyMargin() {
    paper.style.paddingTop = (Number(byId("m-top").value) * MM_TO_PX) + "px";
    paper.style.paddingBottom = (Number(byId("m-bottom").value) * MM_TO_PX) + "px";
    paper.style.paddingLeft = (Number(byId("m-left").value) * MM_TO_PX) + "px";
    paper.style.paddingRight = (Number(byId("m-right").value) * MM_TO_PX) + "px";
  }
  byId("paper-size").addEventListener("change", applyPaperSize);
  ["m-top", "m-bottom", "m-left", "m-right"].forEach((id) => byId(id).addEventListener("input", applyMargin));
  byId("reset-margin").addEventListener("click", () => {
    byId("m-top").value = 25;
    byId("m-bottom").value = 25;
    byId("m-left").value = 30;
    byId("m-right").value = 20;
    applyMargin();
  });

  // =========================================================
  // ZOOM & PAN
  // =========================================================
  let zoom = 1;
  function applyZoom() {
    paperScale.style.transform = `scale(${zoom})`;
    byId("zoom-label").textContent = Math.round(zoom * 100) + "%";
  }
  byId("zoom-in").addEventListener("click", () => {
    zoom = Math.min(2, zoom + 0.1);
    applyZoom();
  });
  byId("zoom-out").addEventListener("click", () => {
    zoom = Math.max(0.3, zoom - 0.1);
    applyZoom();
  });
  byId("zoom-reset").addEventListener("click", () => {
    zoom = 1;
    applyZoom();
    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
  });

  let isPan = false, sX = 0, sY = 0, sl = 0, st = 0;
  viewport.addEventListener("mousedown", (e) => {
    if (paper.contains(e.target)) return;
    isPan = true;
    viewport.classList.add("is-panning");
    sX = e.pageX; sY = e.pageY;
    sl = viewport.scrollLeft; st = viewport.scrollTop;
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!isPan) return;
    viewport.scrollLeft = sl - (e.pageX - sX);
    viewport.scrollTop = st - (e.pageY - sY);
  });
  document.addEventListener("mouseup", () => {
    isPan = false;
    viewport.classList.remove("is-panning");
  });

  // =========================================================
  // SAMPLE untuk form.html
  // =========================================================
  function buildSampleDataFromFields() {
    const out = {};
    fields.forEach((f) => {
      if (f.sample && f.sample.trim()) out[f.name] = f.sample;
      else if (f.type === "category" && f.options?.length) out[f.name] = f.options[0];
    });
    if (state.identitas.nomor) out.nomor_surat = state.identitas.nomor;
    return out;
  }

  // =========================================================
  // SIMPAN
  // =========================================================
  byId("btn-save").addEventListener("click", () => {
    const nama = byId("template-nama").value.trim();
    if (!nama) return setStatus("Nama jenis surat wajib diisi.", true);

    const templateHtml = BLOCK_ORDER
      .filter((k) => state[k].enabled)
      .map((k) => buildBlockHtml(k))
      .join("");

    if (!templateHtml.trim()) return setStatus("Aktifkan minimal satu blok surat.", true);

    const key = byId("template-key").value.trim() || slugify(nama);
    if (templates.some((t) => t.key === key && t.key !== existing?.key)) {
      return setStatus("Nama surat sudah digunakan.", true);
    }

    try {
      const cleanFields = fields.map((f) => {
        const out = {
          name: f.name,
          label: f.label,
          type: f.type,
          required: Boolean(f.required),
        };
        if (f.type === "category") out.options = Array.isArray(f.options) ? f.options : [];
        return out;
      });

      upsertTemplate({
        key,
        nama,
        deskripsi: byId("template-deskripsi").value.trim(),
        template: templateHtml,
        fields: cleanFields,
        blocks: state,
        logo_url: state.kop.mode === "terstruktur" ? state.kop.logoUrl : "",
        logo: state.kop.mode === "terstruktur" ? state.kop.logoUrl : "",
        kop_foto_url: state.kop.mode === "foto" ? state.kop.fotoUrl : "",
        signature_qr_url: state.ttd.qrUrl,
        sample_data: buildSampleDataFromFields()
      });
      setStatus("Tersimpan. Mengalihkan...", false);
      setTimeout(() => {
        window.location.href = "template.html";
      }, 700);
    } catch (err) {
      console.error(err);
      setStatus("Gagal menyimpan: " + err.message, true);
    }
  });

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle("is-error", Boolean(isError));
  }

  init();
})();