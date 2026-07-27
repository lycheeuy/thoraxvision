# ThoraxVision — Phase 7: AI Analysis Workspace

**Status:** ✅ Selesai & tervalidasi (10 file, seluruhnya lolos type-check)
**Lingkup:** Mengubah halaman prediksi menjadi **AI Analysis Workspace** — fitur utama ThoraxVision. Lapisan presentasi + satu perubahan target redirect. **Tidak** menyentuh logika backend, kontrak API, struktur routing, maupun service.

---

## 1. Tujuan

Menjadikan halaman analisis sebagai pusat produk, disusun ala workstation radiologi: sembilan bagian kerja yang mengalir dari unggah studi → alur kerja AI → hasil → citra & Grad-CAM → confidence → ringkasan klasifikasi → informasi model → disclaimer. Setelah login, pengguna diarahkan ke sini, bukan ke Overview.

---

## 2. File yang Dibuat / Diubah (10)

**Baru — komponen workspace (`src/components/prediction/`)**
| File | Isi |
|------|-----|
| `workspace-section.tsx` | Kerangka section bernomor (indeks + ikon + judul + slot aksi) yang menyatukan sembilan panel |
| `research-disclaimer.tsx` | Panel info riset yang ringkas namun selalu hadir saat hasil ditampilkan |
| `confidence-gauge.tsx` | Gauge melingkar SVG, arc gradien blue→cyan, animasi 0→nilai, angka mono di tengah |
| `workflow-timeline.tsx` | Timeline representasional lima tahap; animasi berurutan selama request; hanya `inference_time` nyata yang ditampilkan |
| `xray-viewer.tsx` | Penampil citra dua mode: side-by-side & compare (wipe divider yang bisa diseret) |
| `classification-summary.tsx` | Verdict + label + bar probabilitas dengan **angka di samping tiap bar** |
| `model-info-panel.tsx` | Panel spesifikasi mesin inferensi (arsitektur/framework/versi/input/kelas/explainability + latensi nyata) |

**Diubah**
| File | Perubahan |
|------|-----------|
| `app/(app)/prediction/page.tsx` | Dirombak jadi workspace penuh: header + status engine, layout 40:60, sembilan section, tiga state, aksi View History, animasi fade |
| `app/(auth)/login/page.tsx` | Redirect pasca-login: `/dashboard` → `/prediction` |
| `app/page.tsx` | Redirect root untuk user terautentikasi: `/dashboard` → `/prediction` |

Catatan: `analysis-result.tsx` dari redesign tidak lagi dipakai page (digantikan komposisi section baru). Boleh dibiarkan atau dihapus.

---

## 3. Keputusan Desain

1. **Timeline representasional, bukan progress palsu.** Backend mengembalikan satu response saat seluruh proses selesai — tidak ada stream progress per-tahap. Timeline menampilkan tahapan yang memang terjadi (Upload → Preprocess → Inference → Grad-CAM → Complete) dan menganimasikannya berurutan **selama request pending**, murni sebagai penanda "sedang bekerja". Satu-satunya angka nyata yang ditampilkan adalah `inference_time` dari backend pada tahap Inference.
2. **Confidence gauge SVG melingkar** dengan gradien blue→cyan. Warna verdict tetap di badge (rose = Tuberculosis, blue = Non-Tuberculosis), bukan di gauge, agar gauge konsisten untuk kedua kelas.
3. **Dashboard tetap ada, dinamai "Overview"** (label sidebar; href `/dashboard` tidak berubah — bukan perubahan routing struktural). Setelah login diarahkan ke `/prediction`.
4. **Layout 40:60** (intake : analysis). Kolom analisis dibuat dominan secara visual; kolom intake sticky saat scroll.
5. **Mode Compare** pada penampil citra: divider yang bisa diseret (pointer events, jalan untuk mouse & sentuh) menyingkap Grad-CAM di atas citra asli pada posisi yang persis sama. Karena citra diproses kotak (224×224), kedua panel `aspect-square` dan sejajar sempurna.
6. **Angka probabilitas di samping bar**, bukan hanya bar; kelas diurutkan dari tertinggi, pemenang ditegaskan warna verdict.
7. **Model sebagai spesifikasi peralatan** — panel inference engine dengan nilai dari `model_info` + `inference_time`, tanpa angka karangan.
8. **Disclaimer ringkas** sebagai panel info di bawah hasil.
9. **Header workspace** menampilkan status engine (ready/standby/offline) dengan polling health 30 detik.
10. **Animasi hasil** fade + scale halus (`fade-up`) saat result muncul.
11. **Aksi "View History"** + "New analysis" muncul setelah prediksi sukses.

---

## 4. Alur State (kolom analisis)

Kolom analisis selalu menampung tepat satu dari empat kondisi, sehingga jawaban selalu muncul di tempat yang sama:

- **idle** — empty state "Awaiting a study"
- **running** — sweep pemindai di atas citra + timeline berjalan
- **error** — ErrorState (pesan/detail/kode dari envelope backend) + tombol retry
- **complete** — verdict + gauge, imaging (side-by-side/compare), panel model, aksi, disclaimer

---

## 5. Sembilan Bagian Workspace (sesuai brief)

1. Upload Study — dropzone drag & drop
2. AI Workflow Timeline — lima tahap representasional
3. Analysis Result — verdict + ringkasan klasifikasi
4. Original X-ray — panel citra asli
5. Grad-CAM Visualization — panel heatmap (+ mode compare)
6. Confidence Gauge — gauge melingkar
7. Classification Summary — bar probabilitas + angka
8. Model Information — panel spesifikasi engine
9. Research Disclaimer — panel info bawah

---

## 6. Batasan yang Dijaga

- **Backend** — nol perubahan.
- **Kontrak API** — tetap; memakai `predictionService.predict()` & `toAbsoluteUrl()` yang sudah ada.
- **Routing** — struktur route group `(auth)`/`(app)` tetap; hanya target redirect yang diubah (bukan struktur).
- **Service & tipe** — tidak berubah.

---

## 7. Cara Uji

Backend jalan (`uvicorn`, model `loaded`), lalu `npm run dev`:

1. Login `student` / `Student123!` → langsung ke `/prediction`.
2. Header workspace: **Engine ready** + titik hijau.
3. Upload X-ray → **Run AI analysis** → timeline berjalan + sweep pemindai.
4. Selesai → hasil fade-in: confidence gauge (gradien blue→cyan) di kiri verdict, imaging dengan toggle **Side-by-side / Compare** (seret divider), panel spesifikasi model.
5. Tombol **View history** & **New analysis**.
6. Layout 40:60 — kolom analisis dominan; intake sticky.

---

## 8. Utang Teknis (tak berubah dari fase sebelumnya)

`POST /api/v1/predict` masih belum diproteksi auth, sehingga `user_id` pada tabel `predictions` tetap NULL. Halaman History (tombolnya sudah tersedia di sini) akan membutuhkan proteksi itu agar bisa memfilter per pengguna — kandidat fase berikutnya, dan itu memerlukan perubahan backend.

---

## 9. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1 / 1.1 | Scaffolding + arsitektur | ✅ |
| 2 | Database | ✅ |
| 3 | AI Inference Engine | ✅ |
| 4 | Prediction API | ✅ |
| 5 | Authentication | ✅ |
| 6 | Frontend Foundation | ✅ |
| — | UI/UX Redesign | ✅ |
| 7 | AI Analysis Workspace | ✅ |
| 8 | (berikutnya — mis. proteksi /predict + halaman History) | ⏭️ |
