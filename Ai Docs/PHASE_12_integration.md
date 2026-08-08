# ThoraxVision — Phase 12: End-to-End Integration Testing Checklist

Pengujian integrasi alur penuh aplikasi. Tanpa perubahan kode. Jalankan dengan backend hidup (uvicorn) + frontend (`npm run dev`). Isi kolom **Pass / Fail** saat menguji. Kredensial: `student` / `Student123!`.

---

## Alur Utama (10 Langkah)

### Langkah 1 — Login

- **Feature:** Autentikasi
- **User Action:** Buka `/login`, masukkan username & password, submit.
- **Expected Backend Behavior:** `POST /api/v1/auth/login` → `200` dengan `access_token`; log `Login success: <username> (role=<role>)`.
- **Expected Frontend Behavior:** Tombol loading saat proses; sukses → redirect ke dashboard/prediction; token tersimpan di context/klien.
- **Expected Database Result:** Tidak ada baris baru; `last_login` pengguna diperbarui (bila diimplementasikan).
- **Pass / Fail:** ______

### Langkah 2 — Dashboard

- **Feature:** Overview
- **User Action:** Setelah login, dashboard termuat otomatis (atau buka `/dashboard`).
- **Expected Backend Behavior:** `GET /api/v1/dashboard` → `200` `DashboardResponse` (statistics, recent_studies, model, system).
- **Expected Frontend Behavior:** `DashboardSkeleton` saat fetch → hero (nama), kartu statistik, recent studies, pipeline, engine, system status.
- **Expected Database Result:** Query baca (count + recent) pada `predictions` untuk pengguna; tanpa tulis.
- **Pass / Fail:** ______

### Langkah 3 — Prediction

- **Feature:** AI Analysis Workspace
- **User Action:** Klik "Start new analysis" → buka `/prediction`.
- **Expected Backend Behavior:** Tidak ada (halaman idle belum memanggil predict).
- **Expected Frontend Behavior:** Sidebar item prediction aktif; workspace state idle mengundang unggah.
- **Expected Database Result:** Tidak ada perubahan.
- **Pass / Fail:** ______

### Langkah 4 — Upload Chest X-ray

- **Feature:** Upload & validasi
- **User Action:** Unggah radiograf dada frontal.
- **Expected Backend Behavior:** Validasi tipe/ukuran saat request diterima (validasi penuh terjadi pada langkah predict).
- **Expected Frontend Behavior:** Pratinjau gambar; tombol analisis aktif; tipe file salah → pesan error tanpa lanjut.
- **Expected Database Result:** Belum ada (unggah belum tersimpan sampai predict sukses).
- **Pass / Fail:** ______

### Langkah 5 — AI Inference

- **Feature:** Inferensi model
- **User Action:** Jalankan analisis.
- **Expected Backend Behavior:** `POST /api/v1/predict` (Bearer) → validasi gambar → inferensi DenseNet121 → log `Inference completed: <label> (<conf>) in <t>s`; Grad-CAM dihasilkan.
- **Expected Frontend Behavior:** State running (timeline/gauge) tanpa progres palsu; menampilkan waktu inferensi nyata setelah selesai.
- **Expected Database Result:** (tulis terjadi di langkah 6) — belum commit sebelum penyimpanan.
- **Pass / Fail:** ______

### Langkah 6 — Save Prediction

- **Feature:** Persistensi hasil
- **User Action:** (otomatis sebagai bagian dari predict)
- **Expected Backend Behavior:** Gambar original/gradcam/thumbnail disimpan ke storage; baris `predictions` dibuat dengan `user_id`; log `Images stored: <file>.png` dan `Prediction finished: id=<n> label=<...> confidence=<...>`.
- **Expected Frontend Behavior:** State complete: label, confidence, gauge, probabilitas, viewer X-ray + Grad-CAM (compare/wipe); tombol View studies / New analysis.
- **Expected Database Result:** Satu baris baru di `predictions` (user_id pengguna, path original/gradcam/thumbnail, predicted_label, confidence, inference_time, created_at).
- **Pass / Fail:** ______

### Langkah 7 — Studies

- **Feature:** Daftar riwayat
- **User Action:** Klik "View studies" → `/studies`.
- **Expected Backend Behavior:** `GET /api/v1/history?page=1&limit=...&sort=newest` → `200` amplop berhalaman, hanya milik pengguna.
- **Expected Frontend Behavior:** Skeleton → tabel 7 kolom; prediksi baru muncul di urutan teratas; search/filter/sort/pagination berfungsi.
- **Expected Database Result:** Query baca dengan filter kepemilikan; tanpa tulis.
- **Pass / Fail:** ______

### Langkah 8 — Study Detail

- **Feature:** Detail studi
- **User Action:** Klik "Open" pada prediksi baru → `/studies/{id}`.
- **Expected Backend Behavior:** `GET /api/v1/history/{id}` → `200` detail lengkap (milik pengguna); id orang lain → `404`.
- **Expected Frontend Behavior:** Breadcrumb, header studi, viewer (compare), gauge, klasifikasi, info, notes; gambar dapat dibuka.
- **Expected Database Result:** Query baca satu baris dengan filter kepemilikan.
- **Pass / Fail:** ______

### Langkah 9 — Model Insights

- **Feature:** Dashboard riset
- **User Action:** Buka `/insights` (sidebar Model Insights).
- **Expected Backend Behavior:** `GET /api/v1/model-insights` → `200` agregat (overview, metrics, classification_report, URL gambar, gwo, research_summary, artifacts).
- **Expected Frontend Behavior:** Semua seksi terisi; gambar (confusion/ROC/training/Grad-CAM) tampil; GWO & summary ter-render; artefak hilang → "belum tersedia".
- **Expected Database Result:** Tidak ada — endpoint hanya membaca artefak file.
- **Pass / Fail:** ______

### Langkah 10 — Logout

- **Feature:** Akhiri sesi
- **User Action:** Klik Logout.
- **Expected Backend Behavior:** `POST /api/v1/auth/logout` → `200` (konfirmasi implementasi: stateless vs server-side).
- **Expected Frontend Behavior:** Token dihapus dari klien; redirect ke `/login`; rute terproteksi tidak lagi dapat diakses.
- **Expected Database Result:** Tidak ada perubahan data (kecuali jika ada pencatatan sesi).
- **Pass / Fail:** ______

---

## Verifikasi Terperinci

### Authentication

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| Protected routes | Rute `(app)` tanpa token → redirect ke `/login` | |
| Token persistence | Refresh browser saat login → tetap terautentikasi (token bertahan) | |
| Logout clears token | Setelah logout, token hilang; rute terproteksi tak dapat diakses | |
| Token invalid | Token rusak/kedaluwarsa → `401`, sesi ditangani (redirect/pesan) | |

### Prediction

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| Upload validation | Non-gambar/tipe tak didukung → `400`, tidak diproses | |
| AI inference | Label + confidence dihasilkan; waktu inferensi nyata | |
| GradCAM generation | Overlay Grad-CAM dibuat & dapat dibuka via URL | |
| Database insertion | Baris `predictions` baru dengan `user_id` benar | |
| Thumbnail generation | Thumbnail dibuat & tampil di Studies/Dashboard | |

### Dashboard

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| Statistics updated | Setelah prediksi baru: `total_studies` +1, `today_studies` +1, TB/normal sesuai label | |
| Recent studies updated | Prediksi baru muncul di urutan teratas recent | |
| Model information shown | Nama/arsitektur/versi/threshold/input_size/classes/device tampil | |
| System status shown | backend/database/ai_model/storage tampil; ai_model true setelah model loaded | |

### Studies

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| Pagination | Prev/next + "Showing X–Y of Z" akurat; filter dipertahankan antar halaman | |
| Search | Search (debounced) menyaring berdasarkan label/notes | |
| Sort | newest/oldest/highest/lowest confidence mengubah urutan | |
| Detail page | Open → `/studies/{id}` menampilkan detail lengkap | |

### Model Insights

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| Metrics loaded | Accuracy/precision/recall/f1 dari classification report | |
| Figures loaded | Confusion/ROC/training/Grad-CAM tampil dari `/static/model-artifacts/...` | |
| Missing artifacts handled | Artefak hilang → seksi "belum tersedia" + `available:false`, tanpa crash | |

### System

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| Refresh browser | Muat ulang di halaman mana pun → tetap login, data ter-fetch ulang | |
| Session persistence | Token bertahan lintas refresh sampai kedaluwarsa/logout | |
| Invalid token | Token dimanipulasi → `401`, ditangani dengan baik | |
| API unavailable | Backend mati → ErrorState/pesan jaringan, aplikasi tidak crash | |
| Empty database | Akun tanpa prediksi → empty state benar di Dashboard & Studies; statistik 0 | |

---

## Uji Isolasi Antar-Pengguna (kritis)

| Item | Expected Result | Pass / Fail |
|------|-----------------|-------------|
| History isolation | User B tidak melihat prediksi User A di daftar | |
| Detail isolation | User B minta id milik User A → `404` (bukan `403`) | |
| Statistik isolation | Dashboard User B hanya menghitung prediksi User B | |

---

## Deployment Readiness Checklist

- □ Backend Stable — semua endpoint merespons benar; tidak ada `500` tak tertangani; degradasi (DB/model down) ditangani.
- □ Frontend Stable — semua halaman render; loading/empty/error/success benar; tidak ada layout overflow.
- □ Authentication Stable — login/me/logout benar; rute terproteksi; token bertahan & dibersihkan saat logout.
- □ Prediction Stable — validasi unggah, inferensi, Grad-CAM, insert DB, thumbnail semuanya berjalan.
- □ Dashboard Stable — statistik & recent studies akurat; model & system status benar.
- □ Studies Stable — pagination/search/sort/detail berfungsi; isolasi kepemilikan terjaga.
- □ Model Insights Stable — metrics & figures termuat; artefak hilang ditangani anggun.
- □ No Console Errors — tidak ada warning React, hydration error, atau error runtime di seluruh alur.
- □ No API Errors — tidak ada `500`/kesalahan tak terduga; semua error memakai amplop standar.
- □ Ready for Production — seluruh item di atas Pass; isolasi antar-pengguna terverifikasi; static files dapat diakses.

---

## Catatan

- Untuk `model.loaded=true` dan `system.ai_model=true` di Dashboard, lakukan minimal satu prediksi lebih dulu dalam sesi berjalan.
- Uji "Empty database" dengan akun baru tanpa prediksi (bukan menghapus data akun lain).
- Konfirmasi perilaku Logout aktual (JWT stateless vs invalidation server) sebelum menandai item logout.
- Periksa Console pada setiap transisi halaman, tidak hanya load pertama.
- Uji "API unavailable" dengan mematikan uvicorn saat frontend berjalan, lalu picu aksi yang memerlukan API.
