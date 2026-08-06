# ThoraxVision — Phase 10: Dashboard API

**Status:** ✅ Selesai & tervalidasi (backend diuji terhadap DB nyata + FastAPI TestClient + data asli pengguna)
**Lingkup:** Satu endpoint backend read-only yang mengagregasi statistik studi, studi terbaru, status model, dan status sistem untuk layar overview. Tidak menyentuh AI engine, inference, atau skema database.

---

## 1. Tujuan

Menyediakan `GET /api/v1/dashboard` — ringkasan agregat untuk halaman overview: berapa banyak studi, berapa TB vs normal, studi terbaru, informasi model AI, dan status hidup tiap subsistem. Read-only; tanpa business logic di router, tanpa SQL manual di service.

---

## 2. File (5)

| File | Status | Isi |
|------|--------|-----|
| `app/domain/schemas/dashboard.py` | baru | Schema Pydantic v2: `Statistics`, `RecentStudy`, `ModelStatus`, `SystemStatus`, `DashboardResponse` |
| `app/services/dashboard_service.py` | baru | `DashboardService` — agregasi read-only |
| `app/api/v1/dashboard.py` | baru | Router tipis `GET /dashboard` (auth-protected) |
| `app/api/deps.py` | diubah | Tambah provider `get_dashboard_service` |
| `app/api/v1/__init__.py` | diubah | Mount `dashboard.router` |

---

## 3. Arsitektur & Alur

```
GET /api/v1/dashboard
  → Depends(get_current_active_user)   (auth wajib)
  → Depends(get_dashboard_service)     (DI, Session dari get_db)
  → DashboardService.get_dashboard_overview(current_user)
  → DashboardResponse
```

Router hanya lapisan HTTP; semua perakitan di service. Exception domain dibiarkan ke global error handler (tanpa try/except di router).

---

## 4. Sumber Data Tiap Bagian

| Bagian | Sumber | Catatan |
|--------|--------|---------|
| `statistics` | `PredictionRepository` | `count_by_user` dengan filter label & date_from. Tanpa SQL manual. |
| `recent_studies` | `PredictionRepository.get_by_user` | limit 5, sort newest |
| `model` | `ModelLoader._instance` → fallback `metadata.json` | `loaded` & `device` selalu dari instance nyata |
| `system` | probe ringan berpagar | backend / database / ai_model / storage |

---

## 5. Keputusan Desain

1. **Statistik sepenuhnya via repository.** `total`, `today` (date_from = awal hari UTC), `tb_detected`, `normal_detected` — semua `count_by_user`. Tidak ada query SQL langsung, tidak ada angka hardcode.
2. **Label dari `labels.json`, bukan hardcode.** labels.json (`{"0":"NON_TBC","1":"TUBERKULOSIS"}`) adalah source of truth; index 1 = kelas positif (TB). Ini mencegah statistik nol saat label tersimpan sebagai nama internal, dan otomatis benar bila label model berubah.
3. **Confidence dikonversi 0–1 → 0–100** di service (schema menandai persen). Nilai yang sudah >1 diteruskan apa adanya (aman terhadap data campuran).
4. **Thumbnail path → URL** mengikuti pola HistoryService: ambil dua segmen path terakhir (subdir + filename) di bawah `STATIC_URL_PREFIX`; menangani path Windows (`\`) maupun POSIX. `None` bila thumbnail tak ada.
5. **Model: ModelLoader dulu, fallback metadata.json.** Bila model belum ter-load, info spesifikasi (arsitektur/versi/threshold/input_size/classes) tetap tampil dari metadata.json. Namun `loaded` tetap jujur mencerminkan `ModelLoader._instance`, dan `device` hanya dari instance nyata (null bila belum loaded).
6. **System status: probe ringan berpagar.** `backend=True`; `database` via `engine.connect()`; `ai_model` via `ModelLoader._instance is not None`; `storage` via `upload_root.exists()`. Semua try/except → `False` saat gagal, tetapi endpoint tetap sukses (tidak pernah 500 karena subsistem mati).
7. **Method `async`** meski repository sinkron — mengikuti tanda tangan yang diminta; repo sinkron dipanggil di dalamnya (pola umum FastAPI).
8. **input_size & classes normalisasi** — input_size dari shape `[1,3,224,224]` → 224; classes dari list atau dict `{"0":...}` → list terurut.

---

## 6. Ketahanan (null-tolerant & degradasi)

- Model belum loaded → `loaded: false`, `device: null`, field lain dari metadata.json (atau null bila file tak ada).
- Database down → `system.database: false`, endpoint tetap mengembalikan response dengan statistik terakhir.
- Thumbnail null → `thumbnail_url: null`.
- labels.json / metadata.json tak terbaca → fallback default, tanpa crash.

---

## 7. Verifikasi

Diuji terhadap SQLite nyata + FastAPI TestClient, memakai data yang meniru produksi pengguna (label `TUBERKULOSIS`/`NON_TBC`, confidence 0–1, path Windows absolut):

- Statistik akurat & isolasi per-user; `tb_detected + normal_detected = total_studies`.
- Recent 5, urut newest-first (tie-breaker id desc); thumbnail null aman.
- Confidence 0–1 → 0–100 (`0.907753` → `90.78`).
- Thumbnail path Windows → `/static/uploads/thumbnails/...`.
- Model unloaded → fallback metadata.json, `loaded=false`, `device=null`; loaded → `device` dari instance, `ai_model=true`.
- Database down → status `false`, endpoint tetap 200.
- Endpoint auth-protected; `async`; DI `service` + `current_user`.

Diuji juga terhadap response asli pengguna: statistik, confidence, thumbnail, dan model semuanya benar setelah perbaikan.

---

## 8. Batasan yang Dijaga

- AI engine, inference, GradCAM — nol sentuhan.
- Skema database — tanpa migrasi.
- Router/service/provider lain — tak diubah selain penambahan Dashboard.
- Tanpa `Any`, tanpa TODO, tanpa SQL manual di service, tanpa business logic di router.

---

## 9. Catatan Operasional

- `model.loaded` / `system.ai_model` / `model.device` baru terisi setelah model ter-load (mis. setelah satu `POST /predict` di sesi berjalan). Sebelum itu, info spesifikasi tetap tampil dari metadata.json — perilaku yang diharapkan.
- `today_studies` memakai awal hari UTC; studi dari hari sebelumnya tidak terhitung sebagai "hari ini".

---

## 10. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1–6 | Scaffolding → Frontend Foundation | ✅ |
| — | UI/UX Redesign | ✅ |
| 7 | AI Analysis Workspace | ✅ |
| 8A | Prediction ↔ User + History API | ✅ |
| 8B | Studies Module (History UI) | ✅ |
| 9 | Model Insights (Research Dashboard) | ✅ |
| 10 | Dashboard API | ✅ |
| — | (kandidat) Dashboard/Overview frontend yang mengonsumsi endpoint ini; redesign login; Docker | ⏭️ |
