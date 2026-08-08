# ThoraxVision — Phase 12: Production Readiness Audit

> **Catatan metode.** Audit ini disusun dari pola, kontrak, dan keputusan yang terbentuk selama pengembangan Fase 1–11, bukan dari pemindaian otomatis seluruh basis kode. Item bertanda **⚠ verifikasi** perlu kamu konfirmasi langsung terhadap kode aktual sebelum dijadikan klaim final (mis. untuk sidang). Penilaian bersifat rekayasa-perangkat-lunak, bukan sertifikasi keamanan formal.

---

## 1. Architecture

| Aspek | Nilai | Keterangan |
|-------|-------|------------|
| Folder structure | **PASS** | Pemisahan `api` / `services` / `infrastructure/repositories` / `domain/schemas` / `ai` / `core` konsisten dan mudah dinavigasi. |
| Layer separation | **PASS** | Router tipis (HTTP), service (logika), repository (akses data), schema (kontrak). Terjaga di endpoint yang dibangun. |
| Clean Architecture consistency | **PASS** | Service bebas dari FastAPI; ketergantungan mengalir ke dalam. Dashboard/History/Model Insights mengikuti pola sama. |
| Dependency Injection | **PASS** | Provider terpusat di `deps.py`; Session via `get_db`; service dirakit lewat `Depends`. |
| Repository pattern | **PASS** | `BaseRepository` + repository spesifik (Prediction/User/Model); statistik Dashboard murni via repository, tanpa SQL manual di service. |
| Service pattern | **PASS** | Setiap use case punya service; agregasi read-only terisolasi dengan baik. |

**Ringkas:** Arsitektur adalah kekuatan utama proyek — konsisten dan disiplin. ⚠ verifikasi: pastikan tidak ada endpoint lama (Fase awal) yang memotong layer (query langsung di router).

---

## 2. Backend

| Item | Nilai | Keterangan |
|------|-------|------------|
| Authentication | **PASS** | OAuth2 password + JWT; rantai `get_current_user → active → require_roles`; role tersedia. |
| Prediction | **PASS** | Tertaut pengguna (Fase 8A); validasi gambar; simpan original/gradcam/thumbnail + baris DB. |
| Dashboard | **PASS** | Agregasi read-only; label dari labels.json; confidence 0–100; fallback metadata; degradasi sistem. |
| Studies | **PASS** | Pagination/sort/search/filter; isolasi kepemilikan (`404` untuk id orang lain). |
| Model Insights | **PASS** | Endpoint agregat null-tolerant; parser report toleran; artefak + metadata. |
| Health | **PASS** | Publik; probe DB & model nyata. |
| Logging | **PASS** | Log terstruktur bernama (auth/prediction/ai/storage) terlihat sepanjang alur. |
| Exception Handling | **PASS** | `AppError` + subclass; amplop error global konsisten `{success,error{code,message,detail}}`. |
| Configuration | **WARNING** | Berbasis `.env` + pydantic-settings (baik), tetapi kredensial DB & `SECRET_KEY` harus dipastikan tidak ada default lemah di produksi. ⚠ verifikasi. |
| Security | **WARNING** | Fondasi baik (JWT, auth wajib, isolasi). Perlu pengecekan produksi: kekuatan `SECRET_KEY`, masa berlaku token, CORS origin ketat, rate limiting (belum ada). |

**Ringkas:** Backend matang secara fungsional. Titik lemah adalah konfigurasi/keamanan produksi (rahasia, CORS, rate limit), bukan logika.

---

## 3. Frontend

| Item | Nilai | Keterangan |
|------|-------|------------|
| Layout | **PASS** | Route group `(auth)`/`(app)`; sidebar; kontainer lebar konsisten. |
| Components | **PASS** | Komponen kecil terfokus, dapat dipakai ulang (viewer, gauge, kartu dashboard). |
| State management | **PASS** | Auth via context provider; state lokal per halaman; tidak berlebihan. |
| React Query | **PASS** | Fetch server-state via query; `keepPreviousData` di Studies; refetch interval di Dashboard. |
| API layer | **PASS** | Axios client tunggal + interceptor Bearer; service per domain; `toAbsoluteUrl` konsisten. |
| Loading states | **PASS** | Skeleton per halaman (Dashboard/Studies/Insights); state running di Prediction. |
| Error states | **PASS** | `ErrorState` + retry pada halaman berbasis query. |
| Responsive design | **PASS** ⚠ | Grid responsif di semua halaman; ⚠ verifikasi di perangkat nyata (tabel Studies di mobile, viewer X-ray). |
| Accessibility | **WARNING** | Alt pada gambar, tombol semantik ada; ⚠ verifikasi fokus keyboard menyeluruh, urutan tab, kontras, dan label ARIA pada kontrol kustom (penggeser compare). |

**Ringkas:** Frontend rapi dan konsisten. Aksesibilitas adalah area yang paling mungkin menyimpan celah kecil (kontrol kustom & keyboard).

---

## 4. AI Module

| Item | Nilai | Keterangan |
|------|-------|------------|
| Model loading | **PASS** | Singleton `ModelLoader` (double-checked locking); dimuat sekali, dipakai ulang. |
| Inference | **PASS** | DenseNet121; threshold pada probs[1]; waktu inferensi dicatat. |
| GradCAM | **PASS** | Overlay dihasilkan & disajikan via static; target layer denseblock4. |
| Metadata | **PASS** | `metadata.json` kaya (arsitektur, performance, threshold); dinormalisasi (input_size shape → int). |
| Artifacts | **PASS** | Artefak riset disajikan read-only; availability + ukuran + modified. |
| Error handling | **PASS** | `MetadataNotFoundError`/`ModelUnavailableError`; model tak tersedia → `503`, bukan crash. |

**Ringkas:** Modul AI solid. ⚠ verifikasi: bobot `.pth` di-ignore git — pastikan prosedur deploy menyediakannya, kalau tidak model gagal load di server bersih.

---

## 5. Database

| Item | Nilai | Keterangan |
|------|-------|------------|
| Schema | **PASS** | `users`, `predictions` dengan kolom lengkap (path gambar, label, confidence, waktu, notes, timestamp). |
| Relationships | **PASS** | `predictions.user_id` FK → `users` (ON DELETE SET NULL). |
| Indexes | **PASS** ⚠ | Index pada `user_id`, `predicted_label`, `created_at` terlihat; ⚠ verifikasi index mendukung pola query Studies/Dashboard (filter+sort). |
| Alembic | **PASS** | Migrasi berjalan (revisi terlacak); seed pengguna awal. |
| Repository usage | **PASS** | Akses lewat repository; statistik Dashboard tanpa SQL manual. |

**Ringkas:** Skema dan migrasi sehat. ⚠ verifikasi index komposit bila dataset membesar.

---

## 6. Deployment

| Item | Nilai | Keterangan |
|------|-------|------------|
| Docker | **FAIL / belum** | Docker terpasang tetapi belum digunakan untuk containerisasi aplikasi; belum ada Dockerfile/compose final teruji. |
| Environment variables | **WARNING** | `.env` dipakai; ⚠ verifikasi tidak ada rahasia ter-commit dan ada `.env.example` untuk deploy. |
| Production build | **WARNING** | Frontend `next build` ⚠ verifikasi lolos bersih; backend jalan via uvicorn (butuh proses manager di produksi, mis. gunicorn/uvicorn workers). |
| HTTPS | **FAIL / belum** | Belum ada terminasi TLS terkonfigurasi. |
| Reverse proxy | **FAIL / belum** | Belum ada Nginx/Caddy di depan API + static + frontend. |
| VPS | **WARNING** | Belum ada prosedur deploy VPS terdokumentasi (proses manager, autostart, log rotation). |

**Ringkas:** Deployment adalah kategori paling belum siap. Aplikasi berjalan lokal dengan baik, tetapi jalur produksi (Docker, TLS, reverse proxy, proses manager) belum ada.

---

## 7. Security

| Item | Nilai | Keterangan |
|------|-------|------------|
| JWT | **PASS** ⚠ | Access token diterbitkan & divalidasi; ⚠ verifikasi masa berlaku wajar & algoritma/secret kuat. |
| Protected routes | **PASS** | Endpoint sensitif memerlukan Bearer; frontend melindungi rute `(app)`. |
| File upload validation | **PASS** | Tipe/isi gambar divalidasi; tipe tak didukung → `400`. ⚠ verifikasi batas ukuran maksimum. |
| Input validation | **PASS** | Pydantic v2 di seluruh schema; query Studies tervalidasi. |
| Secrets | **WARNING** | ⚠ verifikasi `SECRET_KEY` produksi kuat & tidak default; kredensial DB tidak ter-commit. |
| CORS | **WARNING** | Origin dikonfigurasi; ⚠ verifikasi dibatasi ke domain frontend produksi (bukan `*`). |

**Ringkas:** Kontrol keamanan inti ada dan benar. Yang tersisa adalah pengerasan produksi (rahasia, CORS ketat, batas ukuran unggah, dan pertimbangan rate limiting).

---

## 8. Code Quality

| Item | Nilai | Keterangan |
|------|-------|------------|
| Naming | **PASS** | Konsisten & deskriptif (service/repository/schema). |
| Consistency | **PASS** | Pola sama diulang antar fitur (service read-only, provider DI, service frontend). |
| Modularity | **PASS** | Tanggung jawab terpisah; file fokus. |
| Reusability | **PASS** | Komponen & util dipakai ulang (viewer, gauge, `toAbsoluteUrl`, json-view generik). |
| Maintainability | **PASS** ⚠ | Struktur mudah dikembangkan; ⚠ verifikasi cakupan uji otomatis (unit/integrasi) — bila minim, ini utang untuk jangka panjang. |

**Ringkas:** Kualitas kode tinggi dan konsisten. Kesenjangan paling mungkin adalah suite pengujian otomatis (berbeda dari checklist manual Fase 12).

---

## 9. Risks

### High Priority
- **Jalur deployment belum ada** — tanpa reverse proxy + HTTPS + proses manager, aplikasi belum layak diekspos ke internet.
- **Pengerasan rahasia/CORS** ⚠ — `SECRET_KEY` lemah atau CORS `*` di produksi adalah risiko nyata; wajib diverifikasi.
- **Ketersediaan bobot model saat deploy** — `.pth` di-ignore git; server bersih tanpa bobot → model gagal load.

### Medium Priority
- **Tidak ada rate limiting** pada endpoint auth/predict — rentan brute force / penyalahgunaan.
- **Batas ukuran unggah** ⚠ verifikasi — file sangat besar bisa membebani.
- **Aksesibilitas** kontrol kustom (penggeser compare, navigasi keyboard) perlu audit.
- **Cakupan uji otomatis** ⚠ — verifikasi manual kuat, tetapi regresi jangka panjang butuh tes otomatis.

### Low Priority
- **Perilaku logout** (stateless vs invalidation) perlu ditegaskan & didokumentasikan.
- **Index komposit** untuk skala data besar.
- **Blok `performance` metadata** (AUC/sensitivity/specificity) belum tampil di UI Insights — peluang, bukan risiko.
- **Konsistensi minor** (mis. tautan lama `/performance` → `/insights`) — pastikan tidak ada dead link tersisa.

---

## 10. Final Score

> Skor mencerminkan kesiapan produksi relatif, dengan bobot pada apa yang menghalangi rilis nyata. Fungsionalitas tinggi; celah utama ada di operasionalisasi (deploy) dan pengerasan (security produksi).

| Kategori | Skor (0–100) |
|----------|--------------|
| Architecture | 92 |
| Backend | 88 |
| Frontend | 85 |
| AI | 88 |
| Database | 85 |
| Security | 70 |
| Deployment | 45 |
| **Overall** | **78** |

### Production Ready? **NO**

Aplikasi **lengkap dan stabil secara fungsional**, dan sangat kuat sebagai proyek skripsi/akademik. Namun untuk **produksi yang terekspos internet**, masih ada blocker operasional & pengerasan.

#### Blockers tersisa (hanya yang menghalangi produksi)
1. **Tidak ada HTTPS/TLS.**
2. **Tidak ada reverse proxy** (Nginx/Caddy) di depan API, static, dan frontend.
3. **Tidak ada proses manager produksi** untuk backend (uvicorn `--reload` bukan untuk produksi).
4. **Pengerasan rahasia & CORS** belum dipastikan (⚠ `SECRET_KEY` kuat, CORS dibatasi ke domain produksi).
5. **Prosedur penyediaan bobot model** (`.pth`) di lingkungan deploy belum ada.
6. **Rate limiting** pada endpoint autentikasi & prediksi belum ada (disarankan sebelum publik).

> Untuk konteks **akademik / demo terkontrol (localhost / jaringan kampus)**: aplikasi **siap dipresentasikan** apa adanya. Blocker di atas relevan khusus untuk **rilis publik ke internet**.
