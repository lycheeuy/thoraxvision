# ThoraxVision — Phase 4: Prediction API

**Status:** ✅ Selesai & terbukti end-to-end (PostgreSQL nyata, model asli, Swagger)
**Lingkup:** REST API prediksi yang menghubungkan FastAPI dengan AI Engine (Phase 3). Tanpa frontend, dashboard, halaman history, atau Docker.

---

## 1. Tujuan

Membangun `POST /api/v1/predict` yang menerima X-ray, menjalankan inference + Grad-CAM (AI Engine Phase 3 dipakai apa adanya), menyimpan citra, mencatat hasil ke PostgreSQL, dan mengembalikan JSON. Seluruh business logic berada di service layer, bukan di route (Clean Architecture).

---

## 2. Alur Prediksi

```
Terima gambar (multipart, field "image")
  → Validasi ekstensi (jpg/jpeg/png)
  → Validasi ukuran (≤ 10 MB)
  → Buka dengan Pillow (decode + verify, konversi RGB)
  → AI Engine: inference (softmax + threshold)
  → AI Engine: Grad-CAM overlay
  → Simpan original / gradcam / thumbnail (UUID sama)
  → INSERT baris ke tabel predictions
  → Return JSON (display names + persentase)
```

---

## 3. File yang Dibuat / Diubah

**Core**
| File | Isi |
|------|-----|
| `core/config.py` | Path absolut anti-CWD (`BACKEND_DIR`), batas upload, ekstensi, ukuran thumbnail, prefix static, log level |
| `core/logger.py` | Konfigurasi logger tree `thoraxvision.*` (started / finished / failed) |
| `core/exceptions.py` | 9 exception aplikasi, masing-masing dengan `error_code` + `status_code` |

**Storage** (`infrastructure/storage/`)
| File | Isi |
|------|-----|
| `image_processor.py` | Validasi ekstensi/ukuran, decode + `verify()`, konversi RGB, pembuatan thumbnail |
| `storage_service.py` | Auto-create folder, nama UUID4 (dibagi tiga artefak), **anti-overwrite**, penyimpanan all-or-nothing, rollback file |

**Domain** (`domain/schemas/`)
| File | Isi |
|------|-----|
| `common.py` | `ErrorResponse` (envelope error tunggal), `HealthResponse` |
| `prediction.py` | `PredictionResponse` + `ModelMetadata` (Pydantic v2) |

**Aplikasi**
| File | Isi |
|------|-----|
| `services/prediction_service.py` | **Seluruh business logic** — validate → decode → infer → Grad-CAM → simpan → INSERT → response. Tidak mengimpor FastAPI |
| `infrastructure/repositories/prediction_repository.py` | `create_prediction()` bertipe di atas `BaseRepository` |
| `api/deps.py` | Dependency injection: `get_db`, `get_inference_engine`, `get_prediction_service` |
| `api/error_handlers.py` | Pemetaan exception → HTTP status, semua ke satu envelope |
| `api/v1/prediction.py` | Route tipis `POST /predict` |
| `api/v1/health.py` | `GET /health` — status API, database, model |
| `api/v1/__init__.py` | Router aggregator |
| `main.py` | Mount StaticFiles, register handlers, lifespan (buat folder saat startup) |
| `ml_models/metadata.json` | Tambah `display_names` (presentasi; `labels.json` tetap sumber kebenaran label) |
| `ai/loader.py` | Patch 1 baris: `settings.model_file` (path absolut, dibutuhkan unit test) |

**Tes** (`tests/`): `test_ai_engine.py`, `test_prediction_service.py`, `test_prediction_api.py`, `test_storage_service.py`, `conftest.py`.

---

## 4. Keputusan Desain

1. **Route tipis, service tebal** — `prediction.py` hanya membaca bytes dan mendelegasikan; semua logika di `PredictionService`. Karena service tidak menyentuh FastAPI, tesnya bisa 100% mocked tanpa server.
2. **`prediction_id` INTEGER autoincrement** — UUID hanya untuk nama file, bukan PK.
3. **`display_names` terpisah dari `labels.json`** — DB menyimpan label internal (`TUBERKULOSIS` / `NON_TBC`); API menampilkan `Tuberculosis` / `Non Tuberculosis`. Tidak ada label di-hardcode di kode.
4. **Envelope error tunggal** — setiap kegagalan mengembalikan bentuk JSON yang sama:
   ```json
   { "success": false, "error": { "code": "...", "message": "...", "detail": "..." } }
   ```
5. **StaticFiles mount** `/static/uploads` — `gradcam_url` dan `original_image_url` bisa langsung dibuka di browser.

---

## 5. Validasi & Error Handling

| Kondisi | HTTP | error.code |
|---------|------|-----------|
| Ekstensi tidak didukung | 415 | `unsupported_file_type` |
| File > 10 MB | 413 | `file_too_large` |
| Gambar rusak | 422 | `corrupted_image` |
| Model tidak tersedia | 503 | `model_unavailable` |
| Inference gagal | 500 | `prediction_failed` |
| Gagal simpan file | 500 | `file_storage_error` |
| Gagal simpan DB | 500 | `database_error` |

---

## 6. Compensating Rollback (perbaikan pasca-Phase 4)

Insiden nyata saat pengembangan menyingkap celah: file gambar tersimpan **sebelum** INSERT DB, jadi saat DB gagal (auth error) tiga file tertinggal yatim tanpa baris pasangan.

Perbaikan:
- `storage_service.save_prediction_images()` kini **all-or-nothing** — kegagalan menulis artefak kedua/ketiga menghapus yang sudah tertulis.
- `storage_service.delete_prediction_images()` — rollback best-effort; dipanggil `prediction_service` saat INSERT gagal.

Terbukti terhadap PostgreSQL nyata: database dimatikan di tengah request → 500 `database_error` + log `Rolled back stored images` → jumlah file di `uploads/` sebelum == sesudah (tidak ada yatim).

---

## 7. Hasil Validasi

**Swagger — `POST /api/v1/predict` dengan X-ray asli:**
```json
{
  "success": true,
  "prediction": "Tuberculosis",
  "class_id": 1,
  "confidence": 98.51,
  "probabilities": { "Non Tuberculosis": 1.49, "Tuberculosis": 98.51 },
  "original_image_url": "/static/uploads/original/32df4ebb…6186e.png",
  "gradcam_url": "/static/uploads/gradcam/32df4ebb…6186e.png",
  "thumbnail_url": "/static/uploads/thumbnails/32df4ebb…6186e.png",
  "prediction_id": 2,
  "inference_time": 1.2782,
  "model_info": { "name": "ThoraxVision-DenseNet121-GWO", "version": "1.0.0",
                  "framework": "PyTorch", "architecture": "DenseNet121" },
  "created_at": "2026-07-16T23:57:40+07:00"
}
```

**`GET /api/v1/health`:** `status: ok`, `database: connected`, `model: loaded`.

**PostgreSQL:**
```
 id | predicted_label |  conf
----+-----------------+--------
  1 | TUBERKULOSIS    | 0.9851
  2 | TUBERKULOSIS    | 0.9851
```

**Tiga file tersimpan** dengan UUID identik di `uploads/original`, `uploads/gradcam`, `uploads/thumbnails`.

**Unit test:** 19 passed (AI engine, prediction service, prediction API, error envelope, validasi).

---

## 8. Cara Test

### Swagger (manual)
1. `uvicorn app.main:app --reload --port 8000`
2. Buka http://localhost:8000/docs
3. `POST /api/v1/predict` → **Try it out** → pilih file X-ray → **Execute**
4. Klik `gradcam_url` di response untuk memastikan mount static bekerja
5. Uji negatif: `.gif` → 415, file > 10 MB → 413, file teks acak → 422

### pytest (otomatis)
```powershell
python -m pytest tests\ -q
```

### Rollback (manual)
1. Kosongkan folder `uploads\`
2. `Stop-Service postgresql-x64-17` (PowerShell Administrator)
3. Execute `POST /predict` → 500 `database_error`, log `Rolled back stored images`
4. Cek `uploads\` → kosong (tidak ada file yatim)
5. `Start-Service postgresql-x64-17`

---

## 9. Catatan Lingkungan (Windows) — masalah yang ditemui & solusinya

- **psql `password authentication failed`** meski password benar → psql memakai IPv6 (`::1`) dengan metode auth berbeda; solusi: `psql -h 127.0.0.1 ...` (paksa IPv4). Aplikasi tidak terpengaruh karena `POSTGRES_HOST=127.0.0.1`.
- **`permission denied for table predictions`** → tabel dimiliki role lain; solusi: `ALTER TABLE <t> OWNER TO thoraxvision;` + `GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO thoraxvision;`
- **`.env` hanya dibaca saat startup** → setelah mengubah `.env`, restart uvicorn.
- **Execute pertama lambat** → model dimuat sekali (singleton); request berikutnya cepat.

---

## 10. Batasan Fase Ini (sesuai spesifikasi)

Tidak diimplementasikan: frontend, dashboard, halaman history, autentikasi, Docker, deployment.

---

## 11. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1 | Scaffolding & inisialisasi | ✅ |
| 1.1 | Refinement arsitektur | ✅ |
| 2 | Database (PostgreSQL + SQLAlchemy + Alembic) | ✅ |
| 3 | AI Inference Engine | ✅ |
| 4 | Prediction API (upload + prediksi + storage + DB) | ✅ |
| 5 | (berikutnya) | ⏭️ |
