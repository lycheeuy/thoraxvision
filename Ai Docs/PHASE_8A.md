# ThoraxVision — Phase 8A: Prediction ↔ User Integration + History API

**Status:** ✅ Selesai & tervalidasi (7 file; query & endpoint diuji terhadap database nyata + HTTP nyata)
**Lingkup:** Mengintegrasikan autentikasi ke pipeline prediksi dan menambah History API owner-scoped. **Tanpa migrasi database** — kolom `user_id` sudah ada sejak Phase 2. AI Engine, inference, Grad-CAM, skema DB, dan frontend tidak disentuh.

---

## 1. Masalah yang Diselesaikan

Sebelum fase ini, `POST /predict` tidak mengaitkan prediksi dengan pengguna — setiap record tersimpan dengan `user_id = NULL`. Phase 8A menutup celah ini: setiap prediksi baru otomatis menjadi milik pengguna yang terautentikasi, dan setiap pengguna hanya dapat melihat riwayatnya sendiri.

---

## 2. File yang Dibuat / Diubah (7)

**Baru**
| File | Isi |
|------|-----|
| `app/domain/schemas/history.py` | `HistoryItem` (ringkas), `HistoryListResponse` (envelope paginated), `HistoryDetailResponse` (penuh), enum `SortOption` |
| `app/services/history_service.py` | `HistoryService`: read model owner-scoped — pagination, konversi path→URL, confidence 0–1→persen, rekonstruksi probabilitas |
| `app/api/v1/history.py` | Router: `GET /api/v1/history` (list), `GET /api/v1/history/{prediction_id}` (detail) |

**Diubah**
| File | Perubahan |
|------|-----------|
| `app/infrastructure/repositories/prediction_repository.py` | Tambah `get_by_user()` (paginated+sort+search+filter), `count_by_user()`, `get_by_id_for_user()` (kepemilikan) |
| `app/api/v1/prediction.py` | `POST /predict` diproteksi `get_current_active_user`; teruskan `user_id=current_user.id` |
| `app/api/deps.py` | Tambah provider `get_history_service` |
| `app/api/v1/__init__.py` | Mount `history.router` |

**Tidak diubah (sesuai batasan)**
`prediction_service.py` (sudah menerima `user_id` sejak Phase 4 — tinggal diisi dari endpoint), AI Engine, model loading, inference logic, Grad-CAM, skema database (tanpa migrasi), frontend, auth core.

---

## 3. Keputusan Desain

1. **`POST /predict` wajib-auth** via `get_current_active_user()`. Request tanpa token → 401. Frontend sudah mengirim Bearer token sejak Phase 6, jadi kompatibel.
2. **Record lama `user_id = NULL` dibiarkan.** Tidak ada pemilik, tidak muncul di riwayat siapa pun. Query history selalu memfilter `user_id = <current>`, jadi record NULL tak pernah terpilih.
3. **Query history di dalam `PredictionRepository`**, bukan repository terpisah — keduanya menyentuh tabel `predictions` yang sama.
4. **Kepemilikan → 404, bukan 403.** `get_by_id_for_user()` mengembalikan `None` baik saat record tidak ada maupun saat milik orang lain. Endpoint mengubah keduanya jadi 404 yang identik, sehingga seorang pengguna tak pernah bisa menyimpulkan bahwa id prediksi milik pengguna lain itu nyata.
5. **Tie-breaker `id` pada sorting.** Dua prediksi dengan confidence/tanggal sama diurutkan stabil berdasarkan `id`, agar pagination deterministik (tidak berpindah antar halaman).
6. **`limit` dibatasi 100** di dua lapis: boundary API (422 bila melebihi) dan service (clamp diam-diam) — aman lewat HTTP maupun panggilan internal.

---

## 4. Kontrak API

### `GET /api/v1/history`
Daftar riwayat milik pengguna terautentikasi (paginated).

Query params:
| Param | Tipe | Default | Keterangan |
|-------|------|---------|-----------|
| `page` | int ≥1 | 1 | Nomor halaman (1-based) |
| `limit` | int 1–100 | 20 | Ukuran halaman (maks 100) |
| `sort` | enum | `newest` | `newest` / `oldest` / `highest_confidence` / `lowest_confidence` |
| `search` | str | — | Cocokkan pada `predicted_label` dan `notes` (ILIKE) |
| `label` | str | — | Filter label persis, mis. `Tuberculosis` |
| `date_from` | datetime | — | Prediksi pada/sesudah waktu ini |
| `date_to` | datetime | — | Prediksi pada/sebelum waktu ini |
| `min_confidence` | float 0–100 | — | Confidence minimum (persen) |

Response (`HistoryListResponse`):
```
{
  "success": true,
  "items": [
    {
      "prediction_id": 12,
      "predicted_label": "Tuberculosis",
      "confidence": 98.52,
      "thumbnail_url": "/static/uploads/thumbnails/8f14e45f.png",
      "created_at": "2026-07-14T10:30:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "total_pages": 3
}
```
Item daftar sengaja ringkas dan hanya memuat `thumbnail_url` (URL statis), bukan path filesystem.

### `GET /api/v1/history/{prediction_id}`
Detail penuh satu prediksi milik pengguna. 404 bila tidak ada atau bukan milik pengguna.

Response (`HistoryDetailResponse`): `prediction_id`, `predicted_label`, `confidence`, `probabilities`, `original_image_url`, `gradcam_url`, `thumbnail_url`, `inference_time`, `notes`, `model_info`, `created_at`.

---

## 5. Catatan Data (penting)

- **Confidence disimpan 0–1 di DB**, tetapi API menyajikannya sebagai persen 0–100. `HistoryService` mengonversi (`_to_percent`); `min_confidence` dari API (0–100) juga dikonversi balik ke 0–1 sebelum query.
- **Probabilities direkonstruksi**, bukan disimpan. Tabel `predictions` hanya menyimpan label pemenang + confidence, bukan vektor probabilitas. Untuk dua kelas yang saling eksklusif, kelas lain = (100 − pemenang), sehingga rekonstruksi ini identik dengan aslinya tanpa kehilangan akurasi. Jika kelak model menjadi multi-kelas, bagian ini harus ditinjau ulang.
- **Path → URL:** DB menyimpan path disk absolut; History membangun URL statis dari dua segmen terakhir path (`<subdir>/<filename>`), tahan terhadap perbedaan root antar-mesin maupun pemisah Windows/Unix.

---

## 6. Verifikasi

Diuji terhadap database nyata (SQLAlchemy) dan HTTP nyata (FastAPI TestClient):

- **Isolasi antar-pengguna** — User A melihat miliknya, User B miliknya; tidak saling bocor.
- **Record NULL-owner tak terlihat** siapa pun.
- **Pagination** — ukuran halaman benar, tanpa tumpang tindih antar halaman.
- **Sorting** — keempat mode (newest/oldest/highest/lowest confidence).
- **Search** — pada `predicted_label` dan `notes`.
- **Filter** — `label`, rentang tanggal, `min_confidence` (input 0–100).
- **Boundary** — `sort` tak dikenal → 422; `limit > 100` → 422.
- **Kepemilikan (tes integrasi kunci)** — **User B mengakses prediksi User A → 404**; daftar B tidak memuat record A.
- **Konversi** — path disk→URL statis (Unix & Windows), confidence 0–1→persen, probabilitas berjumlah 100.

---

## 7. Cara Uji Manual (Swagger)

`uvicorn app.main:app --reload --port 8000`, buka `http://localhost:8000/docs`:

1. `POST /predict` **tanpa** login → **401**.
2. `POST /auth/login` (`student`/`Student123!`) → **Authorize** dengan token.
3. `POST /predict` dengan gambar → sukses; kini tercatat milik student.
4. `GET /history` → prediksi muncul; coba `sort`, `label`, `min_confidence`, `page`/`limit`.
5. `GET /history/{id}` → detail lengkap.
6. Login user lain (`admin`/`Admin123!`) → `GET /history/{id}` milik student → **404**.

---

## 8. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1–6 | Scaffolding → Frontend Foundation | ✅ |
| — | UI/UX Redesign | ✅ |
| 7 | AI Analysis Workspace | ✅ |
| 8A | Prediction ↔ User Integration + History API | ✅ |
| 8B | (berikutnya) Halaman History di frontend — tombol "View History" di workspace sudah menautkannya | ⏭️ |

**Catatan 8B:** Halaman History frontend akan mengonsumsi kedua endpoint ini. Karena `POST /predict` kini wajib-auth dan mengisi `user_id`, riwayat per-pengguna sudah punya data yang benar untuk ditampilkan.
