# ThoraxVision — Phase 9: Model Insights (AI Research Dashboard)

**Status:** ✅ Selesai & tervalidasi (backend diuji terhadap HTTP nyata + artefak nyata; frontend type-check bersih)
**Lingkup:** Satu endpoint backend read-only yang mengagregasi seluruh metadata riset + artefak training, dan satu halaman frontend yang mengonsumsinya. Ditujukan untuk penguji skripsi. **Tidak** menyentuh AI engine, inference, GradCAM generation, atau skema database.

---

## 1. Tujuan

Halaman yang menjelaskan model AI di balik ThoraxVision — arsitektur, metrik evaluasi, laporan klasifikasi, kurva, contoh Grad-CAM, dan detail optimasi Grey Wolf Optimizer (GWO). Dashboard riset AI, bukan dashboard admin. Semua nilai riset dibaca dari file; **nol angka di-hardcode**.

---

## 2. Arsitektur

Satu endpoint agregat read-only: `GET /api/v1/model-insights`. Backend membaca artefak dari `backend/ml_models/artifacts/` + `metadata.json`, mem-parse laporan klasifikasi teks jadi JSON, memuat file JSON GWO & ringkasan, menyusun URL gambar (via StaticFiles mount), dan menggabungkan metadata model. Frontend hanya mengonsumsi endpoint ini.

---

## 3. File yang Dibuat / Diubah

### Backend

**Baru**
| File | Isi |
|------|-----|
| `app/core/report_parser.py` | Fungsi murni `parse_classification_report()` — parse tabel `classification_report` sklearn jadi JSON, toleran antar versi/format |
| `app/domain/schemas/model_insights.py` | Schema: `ModelOverview`, `ClassificationRow/Report`, `PerformanceMetrics`, `ArtifactInfo`, `ModelInsightsResponse` |
| `app/services/model_insights_service.py` | `ModelInsightsService` (read-only): baca artefak, parse report, muat JSON, susun URL, gabung metadata |
| `app/api/v1/model_insights.py` | Router `GET /api/v1/model-insights` (auth-protected) |

**Diubah**
| File | Perubahan |
|------|-----------|
| `app/main.py` | Static mount read-only `/static/model-artifacts` → folder artefak (dengan penjaga `is_dir()`) |
| `app/api/v1/__init__.py` | Mount `model_insights.router` |
| `app/core/config.py` | `MODEL_ARTIFACTS_DIR`, `MODEL_ARTIFACTS_URL_PREFIX`, property `model_artifacts_root` |
| `app/api/deps.py` | Provider `get_model_insights_service` |

### Frontend

**Baru**
| File | Isi |
|------|-----|
| `services/model-insights.service.ts` | `modelInsightsService.get()` + `toAbsoluteUrl()` |
| `lib/api/types.ts` (ditambah) | `ModelInsightsResponse` + sub-tipe |
| `app/(app)/insights/page.tsx` | Halaman: merangkai semua seksi berdasarkan availability |
| `components/insights/insights-hero.tsx` | Hero dari metadata + badge "Academic Research" |
| `components/insights/insights-section.tsx` | Wrapper seksi + state "unavailable" |
| `components/insights/model-overview.tsx` | Model Overview dari metadata |
| `components/insights/performance-metrics.tsx` | Kartu metrik + label kualitatif |
| `components/insights/classification-report-table.tsx` | Tabel per-kelas + agregat |
| `components/insights/metric-figure.tsx` | Figur gambar reusable (title/url/caption/description) + fallback |
| `components/insights/gradcam-example.tsx` | Contoh Grad-CAM statis |
| `components/insights/json-view.tsx` | Renderer JSON generik (rekursif; array angka panjang diringkas) |
| `components/insights/gwo-panel.tsx` | Optimization Info — json-view atas gwo |
| `components/insights/research-summary.tsx` | Research Summary — json-view atas ringkasan |

**Diubah**
- `components/layout/sidebar.tsx` — item "Model Insights" → `/insights`

**Dipakai ulang:** `ResearchDisclaimer`, `ErrorState`, `AnalysisSkeleton`, `Badge`, `Card`, pola `client.ts`.

### Artefak (di-commit ke git)
`backend/ml_models/artifacts/{classification_report.txt, confusion_matrix.png, roc_curve.png, training_curves.png, gradcam_example.png, gwo_log.json, research_summary_gwo.json}`

---

## 4. Keputusan Desain

1. **Satu endpoint agregat read-only** — frontend cukup satu request; backend tidak menyentuh AI engine/inference/GradCAM.
2. **Parse `classification_report.txt` di backend** menjadi JSON terstruktur. Parser membaca kolom angka dari kanan sehingga label berspasi ("Non Tuberculosis") aman; menangani baris accuracy 1-atau-2 angka dan `macro avg`/`macro_avg`/`macro average`.
3. **Static mount** `/static/model-artifacts` untuk gambar (bukan base64/FileResponse), konsisten dengan mount `uploads`.
4. **Auth-protected** — sama seperti endpoint lain; penguji mengakses lewat aplikasi yang sudah login.
5. **Null-tolerant** — artefak hilang → bagian itu `null` + `available: false`, bukan error 500. Frontend menampilkan "belum tersedia" untuk seksi yang absen.
6. **Objek `artifacts`** berisi availability + metadata (url, size_bytes, modified_at) per artefak.
7. **Hero sepenuhnya dari metadata.json** + badge "Academic Research".
8. **Renderer JSON generik** (`json-view`) untuk GWO & Research Summary — tanpa asumsi skema; menangani objek/array/skalar; array angka panjang diringkas (count + min/max, tombol "Show all").
9. **Label kualitatif** pada metrik (Excellent ≥95% / High ≥90% / Good ≥80% / Moderate ≥70% / Fair) — presentasi saja; angka dari report.
10. **metric-figure reusable** — menerima title, imageUrl, caption, description; fallback anggun saat gambar null/gagal.

---

## 5. Catatan Data (dari metadata & artefak asli)

- **`input_size`** disimpan sebagai bentuk tensor `[1,3,224,224]` di metadata; service mengekstrak dimensi terakhir (224). Schema menerima int maupun list.
- **`classes`** bisa list atau dict `{"0":...}`; service menormalkan jadi list terurut.
- **Metrik headline** diambil dari weighted average laporan (precision/recall/f1) + baris accuracy. Tidak dihitung ulang, tidak dikarang.
- **`gwo_log.json`** berisi array `log` per-iterasi (iter/wolf/fitness/lr/dropout/dll); dirender generik.

---

## 6. Sebelas Seksi (sesuai brief)

Hero · Model Overview · Performance Metrics · Classification Report (tabel) · Confusion Matrix · ROC Curve · Training Curves · GradCAM Example · Optimization (GWO) · Research Summary · Research Disclaimer.

Setiap seksi memakai `artifacts` availability untuk memutuskan tampil-atau-"belum tersedia".

---

## 7. Verifikasi

Backend diuji terhadap HTTP nyata (FastAPI TestClient) + artefak di disk:
- Overview dari metadata (dict kelas → list terurut, input_size dari shape).
- Availability + metadata per artefak; artefak hilang → null + available=false, tanpa error.
- URL gambar null-tolerant.
- Parser report: 3 variasi format sklearn + edge case (kosong/sampah → None); label berspasi utuh.
- Endpoint auth-protected.

Diuji juga terhadap `metadata.json` + artefak asli pengguna: response `success: true` dengan seluruh bagian terisi.

---

## 8. Cara Uji

Taruh artefak di `backend/ml_models/artifacts/`, jalankan uvicorn, login di `/docs`:
1. `GET /api/v1/model-insights` → JSON lengkap (`overview`, `metrics`, `classification_report`, URL gambar, `gwo`, `research_summary`, `artifacts`).
2. Buka `http://localhost:8000/static/model-artifacts/roc_curve.png` → gambar tampil.
3. Frontend: login → sidebar **Model Insights** → `/insights` → semua seksi terisi.

---

## 9. Batasan yang Dijaga

- AI engine, model loading, inference, GradCAM generation — nol sentuhan.
- Skema database — tanpa migrasi.
- Endpoint & auth core lain, storage — tak berubah.
- Frontend hanya mengonsumsi `/model-insights`; tak ada nilai riset di frontend.

---

## 10. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1–6 | Scaffolding → Frontend Foundation | ✅ |
| — | UI/UX Redesign | ✅ |
| 7 | AI Analysis Workspace | ✅ |
| 8A | Prediction ↔ User Integration + History API | ✅ |
| 8B | Studies Module (History UI) | ✅ |
| 9 | Model Insights (AI Research Dashboard) | ✅ |
| — | (kandidat) redesign login, kontainerisasi Docker, blok `performance` metadata di halaman | ⏭️ |

**Catatan:** `metadata.json` memuat blok `performance` (test_accuracy, auc, sensitivity_tb, specificity_normal, f1_score_weighted) yang saat ini belum ditampilkan terpisah di halaman — kandidat penyempurnaan, karena itu angka evaluasi resmi model dan berguna untuk sidang.
