(function () {
  const params = new URLSearchParams(window.location.search);
  const templateKey = params.get("key");
  const templates = getTemplates();
  const existing = templates.find((item) => item.key === templateKey) || null;

  const form = document.getElementById("template-editor-form");
  const editor = document.getElementById("template-editor");
  const fieldList = document.getElementById("field-list");
  const preview = document.getElementById("template-preview");
  const status = document.getElementById("editor-status");
  const dialog = document.getElementById("field-dialog");
  const dialogFields = document.getElementById("dialog-field-list");
  const dialogEmpty = document.getElementById("dialog-empty");
  let savedSelection = null;
  let fields = existing?.fields?.length ? existing.fields : [];

  // Simpan logo & QR sebagai data URL supaya bisa disimpan ke localStorage
  let logoDataUrl = existing?.logo || "";
  let qrDataUrl = existing?.signature_qr_url || "";

  const byId = (id) => document.getElementById(id);

  function setInitialValues() {
    byId("page-title").textContent = existing ? "Edit template" : "Template baru";
    byId("template-key").value = existing?.key || "";
    byId("template-nama").value = existing?.nama || "";
    byId("template-deskripsi").value = existing?.deskripsi || "";
    editor.innerHTML = existing?.template || "<p>Dengan hormat,</p><p>Dengan ini kami menerangkan bahwa </p>";

    const logoPreview = byId("template-logo-preview");
    if (logoDataUrl) {
      logoPreview.src = logoDataUrl;
      logoPreview.hidden = false;
    }
    const qrPreview = byId("template-qr-preview");
    if (qrDataUrl) {
      qrPreview.src = qrDataUrl;
      qrPreview.hidden = false;
    }

    convertTokensToChips();
  }

  // ==== UPLOAD LOGO (kop surat) ====
  byId("template-logo").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      logoDataUrl = String(reader.result || "");
      const img = byId("template-logo-preview");
      img.src = logoDataUrl;
      img.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  // ==== UPLOAD QR tanda tangan ====
  byId("template-qr").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      qrDataUrl = String(reader.result || "");
      const img = byId("template-qr-preview");
      img.src = qrDataUrl;
      img.hidden = false;
    };
    reader.readAsDataURL(file);
  });

  function createFieldMarkup(field, index) {
    const isCategory = field.type === "category";
    const categories = Array.isArray(field.categories) && field.categories.length
      ? field.categories
      : [{ name: field.label || "Kategori", options: Array.isArray(field.options) ? field.options : [] }];
    const categoryMarkup = isCategory ? `<div class="category-options"><label>Kategori utama dan subkategori</label><div class="category-rows" data-category-rows>${categories.map((category) => `<div class="category-row" data-category-row><input data-category-name value="${escapeHtml(category.name || "")}" placeholder="Contoh: Kesehatan"><input data-category-options value="${escapeHtml((category.options || []).join(", "))}" placeholder="Contoh: Diabetes, Asam Urat"><button type="button" class="remove-category" data-remove-category ${categories.length === 1 ? "hidden" : ""}>Hapus</button></div>`).join("")}</div><button type="button" class="btn btn-ghost add-category" data-add-category>+ Tambah kategori utama</button><small>Kategori utama ditampilkan di dropdown pertama. Subkategori dipakai untuk dropdown kedua.</small></div>` : "";
    return `<div class="field-card" data-field-index="${index}">
      <div class="field-card-top"><strong>Data ${index + 1}</strong><button type="button" class="remove-field" data-remove-field="${index}">Hapus</button></div>
      <div class="field-card-grid">
        <div class="field"><label for="field-label-${index}">Pertanyaan atau nama data</label><input id="field-label-${index}" data-field-label value="${escapeHtml(field.label || "")}" placeholder="Contoh: Nama pemohon" required></div>
        <div class="field"><label for="field-type-${index}">Jenis data</label><select id="field-type-${index}" data-field-type><option value="text" ${field.type === "text" || !field.type ? "selected" : ""}>String biasa</option><option value="category" ${isCategory ? "selected" : ""}>Kategori / dropdown</option><option value="date" ${field.type === "date" ? "selected" : ""}>Tanggal</option><option value="textarea" ${field.type === "textarea" ? "selected" : ""}>Paragraf panjang</option></select></div>
      </div>
      ${categoryMarkup}
      <label class="required-toggle"><input type="checkbox" data-field-required ${field.required ? "checked" : ""}> Wajib diisi saat membuat surat</label>
    </div>`;
  }

  function renderFields() {
    fieldList.innerHTML = fields.map(createFieldMarkup).join("");
    fieldList.querySelectorAll("[data-remove-field]").forEach((button) => button.addEventListener("click", () => {
      if (fields.length === 1) return setStatus("Minimal harus ada satu data.", true);
      fields.splice(Number(button.dataset.removeField), 1);
      renderFields();
      renderPreview();
    }));
    fieldList.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("input", syncFields);
      input.addEventListener("change", () => {
        if (input.matches("[data-field-type]")) {
          syncFields();
          renderFields();
          renderPreview();
          return;
        }
        syncFields();
      });
    });
    fieldList.querySelectorAll("[data-field-index]").forEach(bindCategoryRows);
    fieldList.querySelectorAll("[data-add-category]").forEach((button) => button.addEventListener("click", () => {
      const rows = button.parentElement.querySelector("[data-category-rows]");
      rows.insertAdjacentHTML("beforeend", '<div class="category-row" data-category-row><input data-category-name placeholder="Contoh: Administrasi"><input data-category-options placeholder="Contoh: Kartu Keluarga, KTP"><button type="button" class="remove-category" data-remove-category>Hapus</button></div>');
      bindCategoryRows(button.closest("[data-field-index]"));
      syncFields();
    }));
    renderDialogFields();
  }

  function bindCategoryRows(fieldRow) {
    fieldRow.querySelectorAll("[data-remove-category]").forEach((button) => button.onclick = () => {
      const rows = fieldRow.querySelectorAll("[data-category-row]");
      if (rows.length <= 1) return;
      button.closest("[data-category-row]").remove();
      syncFields();
    });
  }

  function syncFields() {
    fields = [...fieldList.querySelectorAll("[data-field-index]")].map((row) => ({
      name: slugify(row.querySelector("[data-field-label]").value),
      label: row.querySelector("[data-field-label]").value.trim(),
      type: row.querySelector("[data-field-type]").value,
      categories: [...row.querySelectorAll("[data-category-row]")].map((categoryRow) => ({ name: categoryRow.querySelector("[data-category-name]").value.trim(), options: categoryRow.querySelector("[data-category-options]").value.split(",").map((option) => option.trim()).filter(Boolean) })).filter((category) => category.name),
      required: row.querySelector("[data-field-required]").checked,
    }));
    renderDialogFields();
    renderPreview();
  }

  function renderDialogFields() {
    const usableFields = fields.filter((field) => field.label);
    dialogEmpty.hidden = usableFields.length > 0;
    dialogFields.innerHTML = usableFields.map((field) => `<button type="button" class="dialog-field" data-field-name="${escapeHtml(field.name)}"><span class="field-chip">Aa</span><span><strong>${escapeHtml(field.label)}</strong><small>${field.type === "category" ? "Kategori / dropdown" : field.type === "date" ? "Tanggal" : field.type === "textarea" ? "Paragraf panjang" : "String biasa"}</small></span></button>`).join("");
    dialogFields.querySelectorAll("[data-field-name]").forEach((button) => button.addEventListener("click", () => insertField(button.dataset.fieldName)));
  }

  function saveSelection() {
    const selection = window.getSelection();
    if (selection.rangeCount && editor.contains(selection.anchorNode)) savedSelection = selection.getRangeAt(0).cloneRange();
  }

  function insertField(name) {
    editor.focus();
    const selection = window.getSelection();
    selection.removeAllRanges();
    if (savedSelection) selection.addRange(savedSelection);
    const chip = document.createElement("span");
    chip.className = "field-chip editor-chip";
    chip.dataset.field = name;
    chip.contentEditable = "false";
    chip.textContent = `{{${name}}}`;
    const range = selection.rangeCount ? selection.getRangeAt(0) : document.createRange();
    if (!selection.rangeCount) range.selectNodeContents(editor);
    range.deleteContents();
    range.insertNode(chip);
    range.setStartAfter(chip);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    closeDialog();
    renderPreview();
  }

  function convertTokensToChips() {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      if (!/{{\s*[\w-]+\s*}}/.test(node.nodeValue)) return;
      const fragment = document.createDocumentFragment();
      let text = node.nodeValue;
      let match;
      while ((match = /{{\s*([\w-]+)\s*}}/.exec(text))) {
        fragment.append(document.createTextNode(text.slice(0, match.index)));
        const chip = document.createElement("span");
        chip.className = "field-chip editor-chip";
        chip.dataset.field = match[1];
        chip.contentEditable = "false";
        chip.textContent = match[0];
        fragment.append(chip);
        text = text.slice(match.index + match[0].length);
      }
      fragment.append(document.createTextNode(text));
      node.replaceWith(fragment);
    });
  }

  function serializeEditor() {
    const clone = editor.cloneNode(true);
    clone.querySelectorAll(".editor-chip").forEach((chip) => chip.replaceWith(document.createTextNode(`{{${chip.dataset.field}}}`)));
    return clone.innerHTML.trim() || "<p></p>";
  }

  function renderPreview() {
    convertTokensToChips();
    syncFieldsFromDom();
    const sample = {};
    fields.forEach((field) => { sample[field.name] = field.type === "date" ? "21 September 2026" : `Contoh ${field.label || "data"}`; });
    preview.innerHTML = renderTemplate(serializeEditor(), sample);
    validateTokens();
  }

  function syncFieldsFromDom() {
    const rows = [...fieldList.querySelectorAll("[data-field-index]")];
    if (!rows.length) return;
    fields = rows.map((row) => ({ name: slugify(row.querySelector("[data-field-label]").value), label: row.querySelector("[data-field-label]").value.trim(), type: row.querySelector("[data-field-type]").value, categories: [...row.querySelectorAll("[data-category-row]")].map((categoryRow) => ({ name: categoryRow.querySelector("[data-category-name]").value.trim(), options: categoryRow.querySelector("[data-category-options]").value.split(",").map((option) => option.trim()).filter(Boolean) })).filter((category) => category.name), required: row.querySelector("[data-field-required]").checked }));
  }

  function validateTokens() {
    const known = new Set(fields.map((field) => field.name));
    const tokens = [...serializeEditor().matchAll(/{{\s*([\w-]+)\s*}}/g)].map((match) => match[1]);
    const unknown = [...new Set(tokens.filter((token) => !known.has(token)))];
    setStatus(unknown.length ? `Data tidak dikenali: ${unknown.join(", ")}. Tambahkan datanya atau hapus dari isi surat.` : "Isi surat siap disimpan.", unknown.length);
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function openDialog() { saveSelection(); renderDialogFields(); dialog.hidden = false; }
  function closeDialog() { dialog.hidden = true; }

  document.querySelectorAll("[data-command]").forEach((button) => button.addEventListener("click", () => {
    editor.focus();
    document.execCommand(button.dataset.command, false);
    renderPreview();
  }));
  byId("insert-field-button").addEventListener("click", openDialog);
  document.querySelectorAll("[data-close-dialog]").forEach((element) => element.addEventListener("click", closeDialog));
  editor.addEventListener("keyup", renderPreview);
  editor.addEventListener("mouseup", saveSelection);
  editor.addEventListener("input", renderPreview);

  function addField(type) {
    fields.push(type === "category"
      ? { label: `Kategori ${fields.length + 1}`, type: "category", categories: [{ name: "Kategori utama", options: [] }], required: false }
      : { label: `Data ${fields.length + 1}`, type: "text", required: false });
    renderFields();
    renderPreview();
  }

  byId("add-string-button").addEventListener("click", (event) => {
    event.preventDefault();
    addField("text");
  });
  byId("add-category-button").addEventListener("click", (event) => {
    event.preventDefault();
    addField("category");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    syncFieldsFromDom();
    const name = byId("template-nama").value.trim();
    const key = byId("template-key").value.trim() || slugify(name);
    const tokens = [...serializeEditor().matchAll(/{{\s*([\w-]+)\s*}}/g)].map((match) => match[1]);
    const unknown = tokens.filter((token) => !fields.some((field) => field.name === token));
    if (!name || fields.some((field) => !field.label) || unknown.length) return setStatus(unknown.length ? `Data belum tersedia: ${[...new Set(unknown)].join(", ")}.` : "Lengkapi nama surat dan semua data terlebih dahulu.", true);
    if (templates.some((item) => item.key === key && item.key !== existing?.key)) return setStatus("Nama surat ini sudah digunakan. Pilih nama yang berbeda.", true);

    const savedTemplate = upsertTemplate({
      key,
      nama: name,
      deskripsi: byId("template-deskripsi").value.trim(),
      template: serializeEditor(),
      fields,
      logo: logoDataUrl,
      signature_qr_url: qrDataUrl,
    });
    const savedTemplates = getTemplates();
    const saved = savedTemplates.find((template) => template.key === savedTemplate.key);
    if (!saved || saved.nama !== name || saved.fields.length !== fields.length) {
      return setStatus("Template belum tersimpan. Periksa kembali data lalu coba lagi.", true);
    }
    setStatus("Template berhasil disimpan. Membuka daftar template...");
    window.location.href = "template.html";
  });

  setInitialValues();
  renderFields();
  renderPreview();
})();
