var SESSION_KEY = "suratapp_session";
var AUTH_KEY = "suratapp_auth";
var AUTH_VERSION = 2;
var TEMPLATES_KEY = "suratapp_templates";
var DIRUT_KEY = "suratapp_dirut";
var LETTERS_KEY = "suratapp_letters";
var DUMMY_TEMPLATE_SEED_KEY = "suratapp_dummy_blitar_seeded";
var DUMMY_TEMPLATE_VERSION_KEY = "suratapp_dummy_blitar_version";
var DUMMY_LETTERS_SEED_KEY = "suratapp_dummy_letters_seeded";
var pendingProtectedControl = null;

// =========================================================
// SEED DETERMINISTIK — fungsi PRNG stabil
// =========================================================
function seededRandom(seed) {
  var x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// Tanggal acuan DIBEKUKAN supaya seed stabil antar-waktu
var SEED_ANCHOR = new Date("2026-09-30T00:00:00Z");

// =========================================================
// DEFAULT TEMPLATES — 8 JENIS KEABSAHAN
// =========================================================
var DEFAULT_TEMPLATES = [
  {
    key: "keabsahan_akta_kelahiran",
    nama: "Jawaban Keabsahan Akta Kelahiran",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Kelahiran.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama</td><td class="data-colon">:</td><td>{{nama_pemilik}}</td></tr><tr><td class="data-label">Tempat, Tanggal Lahir</td><td class="data-colon">:</td><td>{{tempat_tanggal_lahir}}</td></tr><tr><td class="data-label">No. Akta Kelahiran</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Kelahiran</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr><tr><td class="data-label">Nama Ayah</td><td class="data-colon">:</td><td>{{nama_ayah}}</td></tr><tr><td class="data-label">Nama Ibu</td><td class="data-colon">:</td><td>{{nama_ibu}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Kelahiran tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_pemilik", label: "Nama pemilik akta", type: "text", required: true },
      { name: "tempat_tanggal_lahir", label: "Tempat, tanggal lahir", type: "text", required: true },
      { name: "nomor_akta", label: "Nomor akta kelahiran", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta kelahiran", type: "date", required: true },
      { name: "nama_ayah", label: "Nama ayah", type: "text", required: true },
      { name: "nama_ibu", label: "Nama ibu", type: "text", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1785/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5971/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Kelahiran a.n. EKA FARID SANI",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_pemilik: "EKA FARID SANI",
      tempat_tanggal_lahir: "Tuban, 07 Maret 1993",
      nomor_akta: "429 TAHUN 1993",
      tanggal_akta: "1993-03-09",
      nama_ayah: "Sugiono",
      nama_ibu: "Hani'ah",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_kematian",
    nama: "Jawaban Keabsahan Akta Kematian",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Kematian.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama Almarhum/ah</td><td class="data-colon">:</td><td>{{nama_almarhum}}</td></tr><tr><td class="data-label">NIK</td><td class="data-colon">:</td><td>{{nik_almarhum}}</td></tr><tr><td class="data-label">Tempat, Tanggal Lahir</td><td class="data-colon">:</td><td>{{tempat_tanggal_lahir}}</td></tr><tr><td class="data-label">Tanggal Meninggal</td><td class="data-colon">:</td><td>{{tanggal_meninggal}}</td></tr><tr><td class="data-label">Tempat Meninggal</td><td class="data-colon">:</td><td>{{tempat_meninggal}}</td></tr><tr><td class="data-label">No. Akta Kematian</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Kematian</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Kematian tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_almarhum", label: "Nama almarhum/ah", type: "text", required: true },
      { name: "nik_almarhum", label: "NIK almarhum/ah", type: "text", required: true },
      { name: "tempat_tanggal_lahir", label: "Tempat, tanggal lahir", type: "text", required: true },
      { name: "tanggal_meninggal", label: "Tanggal meninggal", type: "date", required: true },
      { name: "tempat_meninggal", label: "Tempat meninggal", type: "text", required: true },
      { name: "nomor_akta", label: "Nomor akta kematian", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta kematian", type: "date", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1786/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5972/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Kematian a.n. SUGIONO",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_almarhum: "SUGIONO",
      nik_almarhum: "3513012345670001",
      tempat_tanggal_lahir: "Tuban, 12 Agustus 1960",
      tanggal_meninggal: "2025-11-03",
      tempat_meninggal: "RSUD Dr. R. Koesma Tuban",
      nomor_akta: "121 TAHUN 2025",
      tanggal_akta: "2025-11-05",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_perkawinan",
    nama: "Jawaban Keabsahan Akta Perkawinan",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Perkawinan.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama Suami</td><td class="data-colon">:</td><td>{{nama_suami}}</td></tr><tr><td class="data-label">Nama Istri</td><td class="data-colon">:</td><td>{{nama_istri}}</td></tr><tr><td class="data-label">Tanggal Perkawinan</td><td class="data-colon">:</td><td>{{tanggal_perkawinan}}</td></tr><tr><td class="data-label">Tempat Perkawinan</td><td class="data-colon">:</td><td>{{tempat_perkawinan}}</td></tr><tr><td class="data-label">No. Akta Perkawinan</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Perkawinan</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Perkawinan tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_suami", label: "Nama suami", type: "text", required: true },
      { name: "nama_istri", label: "Nama istri", type: "text", required: true },
      { name: "tanggal_perkawinan", label: "Tanggal perkawinan", type: "date", required: true },
      { name: "tempat_perkawinan", label: "Tempat perkawinan", type: "text", required: true },
      { name: "nomor_akta", label: "Nomor akta perkawinan", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta perkawinan", type: "date", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1787/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5973/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Perkawinan a.n. BUDI & SITI",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_suami: "BUDI SANTOSO",
      nama_istri: "SITI AMINAH",
      tanggal_perkawinan: "2015-06-12",
      tempat_perkawinan: "KUA Kecamatan Tuban",
      nomor_akta: "045/2015",
      tanggal_akta: "2015-06-15",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_perceraian",
    nama: "Jawaban Keabsahan Akta Perceraian",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Perceraian.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama Penggugat</td><td class="data-colon">:</td><td>{{nama_penggugat}}</td></tr><tr><td class="data-label">Nama Tergugat</td><td class="data-colon">:</td><td>{{nama_tergugat}}</td></tr><tr><td class="data-label">Putusan Pengadilan</td><td class="data-colon">:</td><td>{{nomor_putusan}}</td></tr><tr><td class="data-label">Tanggal Putusan</td><td class="data-colon">:</td><td>{{tanggal_putusan}}</td></tr><tr><td class="data-label">Tanggal Perceraian</td><td class="data-colon">:</td><td>{{tanggal_perceraian}}</td></tr><tr><td class="data-label">No. Akta Perceraian</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Perceraian</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Perceraian tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_penggugat", label: "Nama penggugat", type: "text", required: true },
      { name: "nama_tergugat", label: "Nama tergugat", type: "text", required: true },
      { name: "nomor_putusan", label: "Nomor putusan pengadilan", type: "text", required: true },
      { name: "tanggal_putusan", label: "Tanggal putusan", type: "date", required: true },
      { name: "tanggal_perceraian", label: "Tanggal perceraian", type: "date", required: true },
      { name: "nomor_akta", label: "Nomor akta perceraian", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta perceraian", type: "date", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1788/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5974/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Perceraian a.n. BUDI SANTOSO",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_penggugat: "SITI AMINAH",
      nama_tergugat: "BUDI SANTOSO",
      nomor_putusan: "123/Pdt.G/2024/PA.Tbn",
      tanggal_putusan: "2024-08-14",
      tanggal_perceraian: "2024-08-20",
      nomor_akta: "078/2024",
      tanggal_akta: "2024-09-02",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_pengakuan_anak",
    nama: "Jawaban Keabsahan Akta Pengakuan Anak",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Pengakuan Anak.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama Anak</td><td class="data-colon">:</td><td>{{nama_anak}}</td></tr><tr><td class="data-label">Tempat, Tanggal Lahir</td><td class="data-colon">:</td><td>{{tempat_tanggal_lahir}}</td></tr><tr><td class="data-label">Nama Ayah</td><td class="data-colon">:</td><td>{{nama_ayah}}</td></tr><tr><td class="data-label">Nama Ibu</td><td class="data-colon">:</td><td>{{nama_ibu}}</td></tr><tr><td class="data-label">Tanggal Pengakuan</td><td class="data-colon">:</td><td>{{tanggal_pengakuan}}</td></tr><tr><td class="data-label">No. Akta Pengakuan</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Pengakuan</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Pengakuan Anak tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_anak", label: "Nama anak", type: "text", required: true },
      { name: "tempat_tanggal_lahir", label: "Tempat, tanggal lahir anak", type: "text", required: true },
      { name: "nama_ayah", label: "Nama ayah", type: "text", required: true },
      { name: "nama_ibu", label: "Nama ibu", type: "text", required: true },
      { name: "tanggal_pengakuan", label: "Tanggal pengakuan", type: "date", required: true },
      { name: "nomor_akta", label: "Nomor akta pengakuan", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta pengakuan", type: "date", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1789/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5975/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Pengakuan Anak a.n. ANDI PRATAMA",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_anak: "ANDI PRATAMA",
      tempat_tanggal_lahir: "Tuban, 15 Februari 2018",
      nama_ayah: "BUDI SANTOSO",
      nama_ibu: "SITI AMINAH",
      tanggal_pengakuan: "2018-03-01",
      nomor_akta: "012/2018",
      tanggal_akta: "2018-03-05",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_pengesahan_anak",
    nama: "Jawaban Keabsahan Akta Pengesahan Anak",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Pengesahan Anak.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama Anak</td><td class="data-colon">:</td><td>{{nama_anak}}</td></tr><tr><td class="data-label">Tempat, Tanggal Lahir</td><td class="data-colon">:</td><td>{{tempat_tanggal_lahir}}</td></tr><tr><td class="data-label">Nama Ayah</td><td class="data-colon">:</td><td>{{nama_ayah}}</td></tr><tr><td class="data-label">Nama Ibu</td><td class="data-colon">:</td><td>{{nama_ibu}}</td></tr><tr><td class="data-label">Tanggal Pengesahan</td><td class="data-colon">:</td><td>{{tanggal_pengesahan}}</td></tr><tr><td class="data-label">No. Akta Pengesahan</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Pengesahan</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Pengesahan Anak tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_anak", label: "Nama anak", type: "text", required: true },
      { name: "tempat_tanggal_lahir", label: "Tempat, tanggal lahir anak", type: "text", required: true },
      { name: "nama_ayah", label: "Nama ayah", type: "text", required: true },
      { name: "nama_ibu", label: "Nama ibu", type: "text", required: true },
      { name: "tanggal_pengesahan", label: "Tanggal pengesahan", type: "date", required: true },
      { name: "nomor_akta", label: "Nomor akta pengesahan", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta pengesahan", type: "date", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1790/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5976/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Pengesahan Anak a.n. ANDI PRATAMA",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_anak: "ANDI PRATAMA",
      tempat_tanggal_lahir: "Tuban, 15 Februari 2018",
      nama_ayah: "BUDI SANTOSO",
      nama_ibu: "SITI AMINAH",
      tanggal_pengesahan: "2018-03-10",
      nomor_akta: "013/2018",
      tanggal_akta: "2018-03-12",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_pengangkatan_anak",
    nama: "Jawaban Keabsahan Akta Pengangkatan Anak",
    deskripsi: "Surat jawaban verifikasi keabsahan Kutipan Akta Pengangkatan Anak.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Nama Anak Angkat</td><td class="data-colon">:</td><td>{{nama_anak}}</td></tr><tr><td class="data-label">Tempat, Tanggal Lahir</td><td class="data-colon">:</td><td>{{tempat_tanggal_lahir}}</td></tr><tr><td class="data-label">Nama Orang Tua Angkat</td><td class="data-colon">:</td><td>{{nama_orangtua_angkat}}</td></tr><tr><td class="data-label">Nama Orang Tua Kandung</td><td class="data-colon">:</td><td>{{nama_orangtua_kandung}}</td></tr><tr><td class="data-label">Tanggal Pengangkatan</td><td class="data-colon">:</td><td>{{tanggal_pengangkatan}}</td></tr><tr><td class="data-label">No. Akta Pengangkatan</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta Pengangkatan</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Pengangkatan Anak tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "nama_anak", label: "Nama anak angkat", type: "text", required: true },
      { name: "tempat_tanggal_lahir", label: "Tempat, tanggal lahir anak", type: "text", required: true },
      { name: "nama_orangtua_angkat", label: "Nama orang tua angkat", type: "text", required: true },
      { name: "nama_orangtua_kandung", label: "Nama orang tua kandung", type: "text", required: true },
      { name: "tanggal_pengangkatan", label: "Tanggal pengangkatan", type: "date", required: true },
      { name: "nomor_akta", label: "Nomor akta pengangkatan", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta pengangkatan", type: "date", required: true },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1791/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5977/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Pengangkatan Anak a.n. ANDI PRATAMA",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      nama_anak: "ANDI PRATAMA",
      tempat_tanggal_lahir: "Tuban, 15 Februari 2018",
      nama_orangtua_angkat: "BUDI SANTOSO & SITI AMINAH",
      nama_orangtua_kandung: "AGUS SETIAWAN & RINA WATI",
      tanggal_pengangkatan: "2019-01-15",
      nomor_akta: "005/2019",
      tanggal_akta: "2019-01-20",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  },
  {
    key: "keabsahan_akta_pencatatan_sipil",
    nama: "Jawaban Keabsahan Akta Pencatatan Sipil (Umum)",
    deskripsi: "Surat jawaban verifikasi keabsahan dokumen pencatatan sipil lainnya.",
    layout: "official",
    logo_url: "Lambang_Kabupaten_Tuban.webp",
    logo: "Lambang_Kabupaten_Tuban.webp",
    kop_foto_url: "",
    signature_qr_url: "",
    template: '<table class="blok-kop"><tr><td class="kop-logo"><img src="Lambang_Kabupaten_Tuban.webp" alt="Logo"></td><td class="kop-teks"><div class="kop-instansi">PEMERINTAH KABUPATEN TUBAN</div><div class="kop-dinas">DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL</div><div class="kop-alamat">Jl. Teuku Umar No. 7, Latsari, Kec. Tuban, Kabupaten Tuban, Jawa Timur 62315</div><div class="kop-alamat">Telepon: (0356) 321307 | WhatsApp Pelayanan: 0811-307-764</div><div class="kop-alamat">Pos-el (Email): dispendukcapil@tubankab.go.id / dispendukcapiltuban@gmail.com</div><div class="kop-alamat">Laman (Website): dukcapil.tubankab.go.id</div></td></tr></table><div class="kop-garis garis-double"></div><table class="blok-identitas"><tr><td class="id-kiri"><table class="id-table"><tr><td class="id-label">Nomor</td><td class="id-colon">:</td><td>{{nomor_surat}}</td></tr><tr><td class="id-label">Sifat</td><td class="id-colon">:</td><td>{{sifat_surat}}</td></tr><tr><td class="id-label">Lampiran</td><td class="id-colon">:</td><td>{{lampiran}}</td></tr><tr><td class="id-label">Hal</td><td class="id-colon">:</td><td>{{perihal}}</td></tr></table></td><td class="id-kanan">Tuban, {{tanggal_surat}}</td></tr></table><div class="blok-tujuan"><div>Yth. Kepala Dinas Kependudukan dan</div><div class="tujuan-2">Pencatatan Sipil Kabupaten {{kabupaten_tujuan}}</div><div>di</div><div class="tujuan-kota">{{kota_tujuan}}</div></div><div class="blok-isi"><p class="isi-justify">Dengan hormat,</p><p class="isi-justify">Menindaklanjuti Surat Saudara Nomor: {{nomor_surat_rujukan}} tanggal {{tanggal_rujukan}} perihal pada pokok surat, maka:</p><table class="tabel-data"><tr><td class="data-label">Jenis Akta</td><td class="data-colon">:</td><td>{{jenis_akta}}</td></tr><tr><td class="data-label">Nama Pemilik</td><td class="data-colon">:</td><td>{{nama_pemilik}}</td></tr><tr><td class="data-label">NIK</td><td class="data-colon">:</td><td>{{nik_pemilik}}</td></tr><tr><td class="data-label">No. Akta</td><td class="data-colon">:</td><td>{{nomor_akta}}</td></tr><tr><td class="data-label">Tgl. Akta</td><td class="data-colon">:</td><td>{{tanggal_akta}}</td></tr><tr><td class="data-label">Keterangan</td><td class="data-colon">:</td><td>{{keterangan}}</td></tr></table><p class="isi-justify">Berdasarkan hasil verifikasi dan penelitian berkas, bahwa Dokumen Kutipan Akta Pencatatan Sipil tersebut tercatat dan benar dikeluarkan oleh Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten {{kabupaten_asal}}, untuk selanjutnya bisa diproses sesuai asas domisili.</p><p class="isi-justify">Dapat kami sampaikan bahwa dalam rangka menjaga Zona Integritas Wilayah Bebas Korupsi (WBK) menuju Wilayah Birokrasi Bersih Melayani (WBBM), kami berkomitmen untuk terus meningkatkan kualitas pelayanan dan menjaga integritas dan profesionalisme. Adapun seluruh layanan pada Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban tidak dipungut biaya apapun (<strong>GRATIS Rp 0,-</strong>).</p><p class="isi-justify">Demikian untuk menjadikan maklum dan atas kerjasamanya disampaikan terima kasih.</p></div><div class="blok-ttd blok-ttd-kanan"><div class="ttd-jabatan">{{jabatan_penandatangan}},</div><div class="ttd-qr-wrap"><div class="ttd-space-dummy"></div></div><div class="ttd-nama">{{nama_penandatangan}}</div><div class="ttd-pangkat">{{pangkat_penandatangan}}</div><div class="ttd-nip">NIP. {{nip_penandatangan}}</div></div>',
    fields: [
      { name: "nomor_surat_rujukan", label: "Nomor surat rujukan", type: "text", required: true },
      { name: "tanggal_rujukan", label: "Tanggal surat rujukan", type: "date", required: true },
      { name: "sifat_surat", label: "Sifat surat", type: "text", required: true },
      { name: "lampiran", label: "Lampiran", type: "text", required: true },
      { name: "perihal", label: "Perihal", type: "text", required: true },
      { name: "tanggal_surat", label: "Tanggal surat", type: "date", required: true },
      { name: "kabupaten_tujuan", label: "Kabupaten tujuan", type: "text", required: true },
      { name: "kota_tujuan", label: "Kota tujuan", type: "text", required: true },
      { name: "jenis_akta", label: "Jenis akta", type: "text", required: true },
      { name: "nama_pemilik", label: "Nama pemilik akta", type: "text", required: true },
      { name: "nik_pemilik", label: "NIK pemilik", type: "text", required: true },
      { name: "nomor_akta", label: "Nomor akta", type: "text", required: true },
      { name: "tanggal_akta", label: "Tanggal akta", type: "date", required: true },
      { name: "keterangan", label: "Keterangan tambahan", type: "textarea", required: false },
      { name: "kabupaten_asal", label: "Kabupaten asal penerbit akta", type: "text", required: true }
    ],
    sample_data: {
      nomor_surat: "B/470.02/1792/409.20.3/2026",
      nomor_surat_rujukan: "400.12.3.1/5978/419.112/2026",
      tanggal_rujukan: "2026-09-21",
      sifat_surat: "Biasa",
      lampiran: "-",
      perihal: "Jawaban Keabsahan Akta Pencatatan Sipil a.n. EKA FARID SANI",
      tanggal_surat: "2026-09-22",
      kabupaten_tujuan: "Tuban",
      kota_tujuan: "TUBAN",
      jenis_akta: "Akta Kelahiran / Kematian / Perkawinan / Perceraian / Lainnya",
      nama_pemilik: "EKA FARID SANI",
      nik_pemilik: "3513012345670002",
      nomor_akta: "429 TAHUN 1993",
      tanggal_akta: "1993-03-09",
      keterangan: "Dokumen terverifikasi dan sah.",
      kabupaten_asal: "Tuban",
      jabatan_penandatangan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban",
      nama_penandatangan: "Agung Triwibowo, SE, MM",
      pangkat_penandatangan: "Pembina Utama Muda",
      nip_penandatangan: "19680219 199303 1 005"
    }
  }
];

// =========================================================
// DEFAULT DIRUT
// =========================================================
var DEFAULT_DIRUT = [
  { id: "dirut-001", nama: "Agung Triwibowo, SE, MM", jabatan: "Kepala Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban", pangkat: "Pembina Utama Muda", nip: "19680219 199303 1 005" },
  { id: "dirut-002", nama: "Dina Widyaningtyas Winarni, SE., MM", jabatan: "Kepala Bidang Pelayanan Pencatatan Sipil", pangkat: "Pembina (IV/a)", nip: "197311032003122002" }
];

// =========================================================
// SESSION & AUTH
// =========================================================
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || {}; }
  catch (error) { return {}; }
}
function patchSession(values) {
  var session = getSession();
  for (var k in values) { if (values.hasOwnProperty(k)) session[k] = values[k]; }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function getAuth() {
  try {
    var auth = JSON.parse(localStorage.getItem(AUTH_KEY));
    if (auth && typeof auth === "object" && auth.version === AUTH_VERSION && String(auth.username || "").trim()) return auth;
    return null;
  } catch (error) { return null; }
}
function setAuth(user) {
  var auth = {};
  for (var k in user) { if (user.hasOwnProperty(k)) auth[k] = user[k]; }
  auth.version = AUTH_VERSION;
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  return auth;
}
function clearAuth() { localStorage.removeItem(AUTH_KEY); }

// =========================================================
// LOGIN MODAL
// =========================================================
function isLoginPage() { return location.pathname.endsWith("/login.html"); }

function showLoginModal() {
  if (isLoginPage() || getAuth() || document.getElementById("auth-modal")) return;
  var modal = document.createElement("div");
  modal.id = "auth-modal";
  modal.className = "auth-modal";
  modal.innerHTML = '<div class="auth-modal-backdrop"></div>' +
    '<section class="auth-modal-panel" role="dialog" aria-modal="true">' +
    '<div class="auth-modal-logo"></div>' +
    '<div class="preview-eyebrow">Akses petugas</div>' +
    '<h2>Silakan masuk dulu</h2>' +
    '<p>Login diperlukan sebelum Anda dapat memakai fitur Dinas Kependudukan dan Pencatatan Sipil Kabupaten Tuban.</p>' +
    '<form id="auth-modal-form" class="auth-form">' +
    '<div class="field"><label for="auth-modal-username">Nama pengguna</label>' +
    '<input id="auth-modal-username" name="username" type="text" required></div>' +
    '<div class="field"><label for="auth-modal-password">Kata sandi</label>' +
    '<input id="auth-modal-password" name="password" type="password" required></div>' +
    '<p id="auth-modal-error" class="auth-error"></p>' +
    '<button type="submit" class="btn btn-primary">Masuk</button>' +
    '</form>' +
    '</section>';
  document.body.appendChild(modal);

  modal.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    var values = new FormData(event.currentTarget);
    var username = String(values.get("username") || "").trim();
    var password = String(values.get("password") || "");
    var error = modal.querySelector(".auth-error");
    if (username !== "admin" || password !== "12345678") {
      error.textContent = "Nama pengguna atau kata sandi belum sesuai.";
      return;
    }
    setAuth({ username: username, nama: "Admin Surat" });
    modal.remove();
    var control = pendingProtectedControl;
    pendingProtectedControl = null;
    if (control && control.isConnected) {
      if (control.matches("button[type=submit]") && control.form) control.form.requestSubmit(control);
      else control.click();
    }
  });
  modal.querySelector("input").focus();
}

function protectPage() {
  if (isLoginPage()) return;
  document.addEventListener("click", function (event) {
    if (getAuth() || event.target.closest("#auth-modal")) return;
    var control = event.target.closest("a, button, input, textarea, select, summary");
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

// =========================================================
// TEMPLATES
// =========================================================
function setTemplates(templates) {
  var normalized = Array.isArray(templates) ? templates.map(normalizeTemplate) : [];
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(normalized));
  return normalized;
}

function normalizeTemplate(template) {
  var safeTemplate = template || {};
  var fields = Array.isArray(safeTemplate.fields)
    ? safeTemplate.fields.map(function (field, index) {
        return {
          name: String((field && field.name) || "field_" + (index + 1)),
          label: String((field && field.label) || "Field baru"),
          type: String((field && field.type) || "text"),
          required: Boolean(field && field.required),
          options: Array.isArray(field && field.options) ? field.options : undefined
        };
      })
    : [];

  var renderedTemplate = plainTextToHtml(String(safeTemplate.template || "<p>Isi template surat.</p>"));

  return {
    key: String(safeTemplate.key || slugify(safeTemplate.nama || "template_baru")),
    nama: String(safeTemplate.nama || "Template Baru"),
    deskripsi: String(safeTemplate.deskripsi || "Template surat resmi."),
    layout: String(safeTemplate.layout || ""),
    logo_url: String(safeTemplate.logo_url || ""),
    logo: String(safeTemplate.logo || safeTemplate.logo_url || ""),
    kop_foto_url: String(safeTemplate.kop_foto_url || ""),
    signature_qr_url: String(safeTemplate.signature_qr_url || ""),
    sample_data: safeTemplate.sample_data && typeof safeTemplate.sample_data === "object" ? JSON.parse(JSON.stringify(safeTemplate.sample_data)) : {},
    template: renderedTemplate,
    fields: fields,
    blocks: safeTemplate.blocks && typeof safeTemplate.blocks === "object" ? safeTemplate.blocks : null,
    updated_at: safeTemplate.updated_at || new Date().toISOString()
  };
}

function slugify(value) {
  return String(value || "").toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/^_+|_+$/g, "") || "template_baru";
}

function getTemplates() {
  try {
    var saved = JSON.parse(localStorage.getItem(TEMPLATES_KEY));
    if (Array.isArray(saved) && saved.length) {
      return saved.map(normalizeTemplate);
    }
  } catch (error) { /* ignore */ }
  var normalized = DEFAULT_TEMPLATES.map(normalizeTemplate);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(normalized));
  return normalized;
}

function upsertTemplate(template) {
  var templates = getTemplates();
  var normalized = normalizeTemplate(template);
  var existingIndex = -1;
  for (var i = 0; i < templates.length; i++) { if (templates[i].key === normalized.key) { existingIndex = i; break; } }
  normalized.updated_at = new Date().toISOString();

  if (existingIndex >= 0) {
    templates[existingIndex] = normalized;
  } else {
    templates.unshift(normalized);
  }
  setTemplates(templates);
  return normalized;
}

function deleteTemplate(templateKey) {
  var templates = getTemplates();
  if (!templateKey || templates.length <= 1) return templates;
  var next = templates.filter(function (template) { return template.key !== templateKey; });
  return setTemplates(next);
}

function buildTemplatePreview(template) {
  var safeTemplate = normalizeTemplate(template);
  var sampleData = {};
  (safeTemplate.fields || []).forEach(function (field) {
    var name = String(field.name || "field");
    if (field.type === "date") sampleData[name] = "2026-09-21";
    else if (field.type === "textarea") sampleData[name] = "Contoh " + (field.label || "isi") + " untuk preview.";
    else sampleData[name] = "Contoh " + (field.label || name);
  });
  return renderTemplate(safeTemplate.template, sampleData);
}

// =========================================================
// DIRUT
// =========================================================
function getDirut() {
  try {
    var raw = localStorage.getItem(DIRUT_KEY);
    if (raw !== null) {
      var saved = JSON.parse(raw);
      if (Array.isArray(saved) && saved.length) return saved;
    }
  } catch (error) { /* ignore */ }
  localStorage.setItem(DIRUT_KEY, JSON.stringify(DEFAULT_DIRUT));
  return DEFAULT_DIRUT;
}

function setDirut(signers) {
  var normalized = Array.isArray(signers) ? signers.map(function (s, i) {
    return {
      id: String((s && s.id) || "dirut-" + Date.now() + "-" + i),
      nama: String((s && s.nama) || "").trim(),
      jabatan: String((s && s.jabatan) || "").trim(),
      pangkat: String((s && s.pangkat) || "").trim(),
      nip: String((s && s.nip) || "").trim()
    };
  }).filter(function (s) { return s.nama; }) : [];
  localStorage.setItem(DIRUT_KEY, JSON.stringify(normalized));
  return normalized;
}

function upsertDirut(signer) {
  var list = getDirut().slice();
  var incoming = {
    id: String((signer && signer.id) || "dirut-" + Date.now()),
    nama: String((signer && signer.nama) || "").trim(),
    jabatan: String((signer && signer.jabatan) || "").trim(),
    pangkat: String((signer && signer.pangkat) || "").trim(),
    nip: String((signer && signer.nip) || "").trim()
  };
  if (!incoming.nama) return list;
  var idx = -1;
  for (var i = 0; i < list.length; i++) { if (list[i].id === incoming.id) { idx = i; break; } }
  if (idx >= 0) list[idx] = incoming;
  else list.push(incoming);
  return setDirut(list);
}

function deleteDirut(id) {
  return setDirut(getDirut().filter(function (s) { return s.id !== id; }));
}

// =========================================================
// HELPERS
// =========================================================
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function htmlToPlainText(value) {
  var raw = String(value || "");
  if (!raw) return "";
  var withoutTags = raw.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>|<\/div>|<\/li>|<\/h[1-6]>/gi, "\n").replace(/<[^>]+>/g, "");
  return withoutTags
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#039;/gi, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function plainTextToHtml(value) {
  var raw = String(value || "").trim();
  if (!raw) return "<p></p>";
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;

  var tokens = [];
  var withTokens = raw.replace(/{{\s*([\w-]+)\s*}}/g, function (match) {
    var token = "__SURAT_TOKEN_" + tokens.length + "__";
    tokens.push(match);
    return token;
  });

  var paragraphs = withTokens.split(/\n\s*\n/).map(function (paragraph) { return paragraph.trim(); }).filter(Boolean)
    .map(function (paragraph) {
      var safeParagraph = escapeHtml(paragraph).replace(/__SURAT_TOKEN_(\d+)__/g, function (_, index) { return tokens[Number(index)]; });
      return "<p>" + safeParagraph.replace(/\n/g, "<br>") + "</p>";
    });
  return paragraphs.join("") || "<p></p>";
}

function renderTemplate(template, data) {
  return String(template || "").replace(/{{\s*([\w-]+)\s*}}/g, function (match, key) { return escapeHtml(data[key] || ""); });
}

// =========================================================
// SEED DEMO — DETERMINISTIK (identik di semua origin)
// =========================================================
var DUMMY_SEED_VERSION = "v9-deterministic";
var DUMMY_FLAG = "is_dummy";

function seedDemoLetters() {
  var existing = [];
  try { existing = JSON.parse(localStorage.getItem(LETTERS_KEY)) || []; } catch (e) { existing = []; }
  if (existing.length > 0) {
    localStorage.setItem(DUMMY_LETTERS_SEED_KEY, DUMMY_SEED_VERSION);
    return;
  }

  var templates = getTemplates();
  var signers = getDirut();
  if (!templates.length || !signers.length) return;

  var PATTERN_BY_KEY = {
    "keabsahan_akta_kelahiran":            [14,18,11,20,15,22,17,24,19,26,21,30],
    "keabsahan_akta_kematian":             [5,7,4,8,6,9,7,10,8,11,9,13],
    "keabsahan_akta_perkawinan":           [4,6,3,7,5,8,6,9,7,10,8,11],
    "keabsahan_akta_perceraian":           [2,3,2,4,3,5,4,6,5,7,6,9],
    "keabsahan_akta_pengakuan_anak":       [1,2,1,3,2,4,3,5,4,6,5,7],
    "keabsahan_akta_pengesahan_anak":      [1,2,1,3,2,4,3,5,4,6,5,7],
    "keabsahan_akta_pengangkatan_anak":    [1,1,1,2,2,3,2,4,3,5,4,6],
    "keabsahan_akta_pencatatan_sipil":     [7,8,9,8,10,11,10,12,13,12,14,15]
  };
  var DEFAULT_PATTERN = [8,9,10,9,11,12,11,13,14,13,15,16];

  var creators = [
    "Ahmad Fauzi", "Budi Santoso", "Citra Dewi Lestari", "Dedi Kurniawan",
    "Eka Farid Sani", "Fitri Handayani", "Gunawan Pratama", "Hesti Purnamasari"
  ];

  var today = SEED_ANCHOR;
  var currentYear = today.getFullYear();
  var letters = [];
  var counter = 1;

  for (var yearOffset = 3; yearOffset >= 0; yearOffset--) {
    var year = currentYear - yearOffset;
    var maxMonth = yearOffset === 0 ? today.getMonth() : 11;

    for (var month = 0; month <= maxMonth; month++) {
      for (var ti = 0; ti < templates.length; ti++) {
        var tpl = templates[ti];
        var pattern = PATTERN_BY_KEY[tpl.key] || DEFAULT_PATTERN;
        var count = pattern[month] || 0;

        for (var j = 0; j < count; j++) {
          var seedBase = counter * 7919 + year * 104729 + month * 1299709 + j * 15485863;
          var day    = 1 + Math.floor(seededRandom(seedBase + 1) * 27);
          var hour   = 8 + Math.floor(seededRandom(seedBase + 2) * 9);
          var minute = Math.floor(seededRandom(seedBase + 3) * 60);
          var dt = new Date(year, month, day, hour, minute);
          if (dt.getTime() > SEED_ANCHOR.getTime()) continue;

          var signer  = signers[Math.floor(seededRandom(seedBase + 4) * signers.length)];
          var creator = creators[Math.floor(seededRandom(seedBase + 5) * creators.length)];

          var roll = seededRandom(seedBase + 6);
          var status = roll < 0.06 ? "draft" : roll < 0.10 ? "gagal" : "final";

          var bulanRomawi = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"][dt.getMonth()];

          var mergedData = {};
          var sd = tpl.sample_data || {};
          for (var sk in sd) { if (sd.hasOwnProperty(sk)) mergedData[sk] = sd[sk]; }
          mergedData.tanggal_surat = dt.toISOString().slice(0, 10);
          mergedData.jabatan_penandatangan = signer.jabatan;
          mergedData.nama_penandatangan = signer.nama;
          mergedData.pangkat_penandatangan = signer.pangkat || "";
          mergedData.nip_penandatangan = signer.nip || "";

          letters.push({
            id: "L" + String(counter).padStart(4, "0"),
            template_key: tpl.key,
            created_by: creator,
            created_by_detail: { jabatan: "Staf Pelayanan" },
            signer_mode: "selected",
            signer_id: signer.id,
            signer_nama: signer.nama,
            signer_jabatan: signer.jabatan,
            signer_pangkat: signer.pangkat || "",
            signer_nip: signer.nip || "",
            nomor_surat: "B/" + String(400 + counter).padStart(4, "0") + "/470.02/" + bulanRomawi + "/" + dt.getFullYear(),
            data: mergedData,
            attachment: null,
            status: status,
            created_at: dt.toISOString(),
            updated_at: dt.toISOString(),
            is_dummy: true,
            dummy_seed_version: DUMMY_SEED_VERSION
          });

          counter++;
        }
      }
    }
  }

  letters.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });

  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  localStorage.setItem(DUMMY_LETTERS_SEED_KEY, DUMMY_SEED_VERSION);
}

// =========================================================
// LETTERS
// =========================================================
function getLetters() {
  try {
    if (localStorage.getItem(DUMMY_LETTERS_SEED_KEY) !== DUMMY_SEED_VERSION) {
      seedDemoLetters();
    }
    var saved = JSON.parse(localStorage.getItem(LETTERS_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) { return []; }
}

function getNextLetterId(letters) {
  var highestId = letters.reduce(function (highest, letter) {
    var value = Number(String((letter && letter.id) || "").replace(/^L/, ""));
    return Number.isFinite(value) ? Math.max(highest, value) : highest;
  }, 0);
  return "L" + String(highestId + 1).padStart(4, "0");
}

function upsertLetter(letter) {
  var letters = getLetters();
  var now = new Date().toISOString();
  var existingIndex = -1;
  if (letter && letter.id) {
    for (var i = 0; i < letters.length; i++) { if (letters[i].id === letter.id) { existingIndex = i; break; } }
  }
  var saved = {};
  for (var k in letter) { if (letter.hasOwnProperty(k)) saved[k] = letter[k]; }
  saved.id = existingIndex >= 0 ? letters[existingIndex].id : ((letter && letter.id) || getNextLetterId(letters));
  saved.created_at = existingIndex >= 0 ? letters[existingIndex].created_at : now;
  saved.updated_at = now;

  if (existingIndex >= 0) letters[existingIndex] = saved;
  else letters.unshift(saved);
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  return saved;
}

function deleteLetter(letterId) {
  if (!letterId) return getLetters();
  var letters = getLetters().filter(function (letter) { return letter.id !== letterId; });
  localStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  return letters;
}

function saveLetter(letter) { return upsertLetter(letter); }

// =========================================================
// DUMMY MANAGER
// =========================================================
function countDummyData() {
  var letters = [];
  try { letters = JSON.parse(localStorage.getItem(LETTERS_KEY)) || []; } catch (e) { letters = []; }
  return {
    letters: letters.filter(function (l) { return l && l.is_dummy === true; }).length,
    total: letters.length
  };
}

function purgeDummyData() {
  var letters = [];
  try { letters = JSON.parse(localStorage.getItem(LETTERS_KEY)) || []; } catch (e) { letters = []; }
  var before = letters.length;
  var clean = letters.filter(function (l) { return !(l && l.is_dummy === true); });
  localStorage.setItem(LETTERS_KEY, JSON.stringify(clean));
  localStorage.setItem(DUMMY_LETTERS_SEED_KEY, DUMMY_SEED_VERSION + "-purged");
  return { removedLetters: before - clean.length, remainingLetters: clean.length };
}

function verifyDummyReport() {
  var letters = [];
  try { letters = JSON.parse(localStorage.getItem(LETTERS_KEY)) || []; } catch (e) { letters = []; }
  var dummy = letters.filter(function (l) { return l && l.is_dummy === true; });
  var byTemplate = {};
  dummy.forEach(function (l) { byTemplate[l.template_key] = (byTemplate[l.template_key] || 0) + 1; });
  var byYear = {};
  dummy.forEach(function (l) { var y = new Date(l.created_at).getFullYear(); byYear[y] = (byYear[y] || 0) + 1; });
  console.log("Total dummy:", dummy.length);
  console.log("Per template:");
  console.table(byTemplate);
  console.log("Per tahun:");
  console.table(byYear);
  return { total: dummy.length, byTemplate: byTemplate, byYear: byYear };
}