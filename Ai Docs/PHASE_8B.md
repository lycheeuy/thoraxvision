# ThoraxVision — Phase 8B: Studies Module (Prediction History UI)

**Status:** ✅ Selesai & tervalidasi (type-check bersih)
**Lingkup:** Frontend saja — modul manajemen riwayat analisis AI sebelumnya. Mengonsumsi History API Phase 8A apa adanya. **Tidak** menyentuh backend, kontrak API, maupun arsitektur routing (hanya nama segmen `history` → `studies`).

---

## 1. Tujuan

Membangun modul **Studies**: halaman untuk meninjau, mencari, memfilter, dan membuka kembali analisis X-ray sebelumnya. Dua halaman — daftar (`/studies`) dan detail (`/studies/{id}`) — dengan desain workstation radiologi yang konsisten dengan Phase 7.

---

## 2. File yang Dibuat / Diubah

**Baru — service & tipe**
| File | Isi |
|------|-----|
| `src/services/studies.service.ts` | `studiesService`: `list(query)` → `GET /api/v1/history`; `getById(id)` → `GET /api/v1/history/{id}`; `toAbsoluteUrl()` |
| `src/lib/api/types.ts` (ditambah) | `SortOption`, `HistoryItem`, `HistoryListResponse`, `HistoryModelInfo`, `HistoryDetailResponse`, `StudiesQuery` |

**Baru — halaman & komponen list**
| File | Isi |
|------|-----|
| `src/app/(app)/studies/page.tsx` | Halaman daftar: header + toolbar + tabel + pagination; state loading/empty/error |
| `src/components/studies/studies-toolbar.tsx` | Search (debounced) + filter (label, rentang tanggal, min confidence) + sort |
| `src/components/studies/studies-table.tsx` | Tabel 7 kolom |
| `src/components/studies/study-row.tsx` | Satu baris + thumbnail (rasio konsisten + fallback) + status |
| `src/components/studies/studies-pagination.tsx` | Prev/next + "Showing X–Y of Z" |
| `src/components/studies/studies-empty.tsx` | Empty state (dua rasa: belum ada vs tak cocok filter) |

**Baru — halaman & komponen detail**
| File | Isi |
|------|-----|
| `src/app/(app)/studies/[id]/page.tsx` | Halaman detail: breadcrumb + study header + imaging + gauge + panel |
| `src/components/studies/study-classification.tsx` | Ringkasan klasifikasi (bar probabilitas + angka) |
| `src/components/studies/study-info-panel.tsx` | Study Information (id, tanggal, waktu, inferensi, model, status) |
| `src/components/studies/study-notes.tsx` | Notes read-only |

**Diubah — navigasi**
| File | Perubahan |
|------|-----------|
| `src/components/layout/sidebar.tsx` | Item "Studies" `href`: `/history` → `/studies` |
| `src/app/(app)/prediction/page.tsx` | Tombol "View history" → "View studies", `/history` → `/studies` |

**Dihapus**
- `src/app/(app)/history/` — folder rute lama, diganti `studies/`

**Dipakai ulang (Phase 7 & redesign, tidak dibuat ulang)**
`XrayViewer`, `ConfidenceGauge`, `WorkspaceSection`, `Badge`, `Button`, `Card`, `EmptyState`, `ErrorState`, `AnalysisSkeleton`, dan pola `client.ts` (interceptor Bearer).

---

## 3. Keputusan Desain

1. **Rename penuh History → Studies.** Rute `/studies` dan `/studies/{id}`; setiap referensi navigasi diperbarui. Ini bukan perubahan arsitektur routing (route group `(app)` tetap) — hanya nama segmen.
2. **Kolom Status = hasil prediksi.** Badge "Finding" (rose) untuk Tuberculosis, "Clear" (blue) untuk Non-Tuberculosis — bahasa verdict yang sama dengan workspace.
3. **Semua kemampuan API diekspos di UI:** search, filter label, rentang tanggal, min confidence, sorting, pagination.
4. **Notes read-only.** Tabel `predictions` punya kolom notes tetapi belum ada endpoint tulis, jadi hanya ditampilkan; kosong → "No notes available."
5. **Breadcrumb** di halaman detail (`Studies › #id`).
6. **Study header** menampilkan Study ID, prediksi, confidence, dan tanggal.
7. **Thumbnail rasio konsisten + fallback anggun** — kotak `object-cover`; ikon `ImageOff` saat `thumbnail_url` null maupun saat gambar gagal dimuat.
8. **Reuse komponen Phase 7** di mana bentuk data cocok (`XrayViewer`, `ConfidenceGauge`, `WorkspaceSection`). Untuk yang bentuknya beda (`ClassificationSummary` & `ModelInfoPanel` menerima `PredictionResponse`, sedangkan detail memakai `HistoryDetailResponse`), dibuat panel khusus history agar tipe tetap ketat dan tidak dipaksakan.

---

## 4. Perilaku Halaman

### `/studies` (daftar)
- Pemilik tunggal state: filter + halaman. Fetch via React Query dengan `keepPreviousData` agar pindah halaman mulus (tidak berkedip kosong).
- Empat state: **loading** (skeleton), **error** (retry), **empty** (dua rasa), **tabel + pagination**.
- Mengubah filter mereset ke halaman 1; pindah halaman mempertahankan filter.
- Search di-debounce 350ms agar tidak menembak request per ketikan.
- Slider min confidence bernilai 0 dianggap "tidak difilter".

### `/studies/{id}` (detail)
- **Breadcrumb** → **study header** (badge status, id, label, confidence besar, tanggal) → **imaging** (XrayViewer: side-by-side/compare) berdampingan **confidence gauge** → **classification summary** → **study information** → **notes**.
- Id tidak valid atau bukan milik pengguna (404 dari backend) → error "Study not found" + tombol kembali.
- Bila gambar sudah tidak tersedia (`original_image_url`/`gradcam_url` null), tampil placeholder alih-alih viewer rusak.

---

## 5. Kontrak dengan Backend (Phase 8A)

- **Kepemilikan dijaga backend.** Semua data dari `GET /history` sudah tersaring per pengguna; detail milik orang lain mengembalikan 404, ditangani jadi state "Study not found".
- **Confidence** diterima sebagai persen 0–100 (backend sudah mengonversi dari 0–1).
- **thumbnail_url / *_image_url** relatif (`/static/uploads/...`); `studiesService.toAbsoluteUrl()` menjadikannya absolut, menangani `null` dengan aman.
- **probabilities** direkonstruksi backend dari confidence (dua kelas) — ditampilkan apa adanya.

---

## 6. Cara Uji

Backend jalan (uvicorn, model loaded), `npm run dev`, login:

1. Sidebar → **Studies** membuka `/studies`.
2. Buat beberapa prediksi via New Analysis agar ada data.
3. Di Studies: verifikasi 7 kolom (ID · Thumbnail · Prediction · Confidence · Date · Status · Action); coba search, filter (label/tanggal/min confidence), sort, pagination.
4. Klik **Open** → `/studies/{id}`: breadcrumb, study header, imaging (side-by-side/compare), gauge, classification, study info, notes ("No notes available").
5. Tombol **View studies** di workspace (setelah prediksi sukses) → `/studies`.
6. Buka `/studies/99999` (id tak ada) → "Study not found".

---

## 7. Batasan yang Dijaga

- **Backend** — nol perubahan; History API dipakai apa adanya.
- **Kontrak API** — tetap.
- **Arsitektur routing** — route group `(auth)`/`(app)` tetap; hanya nama segmen `history` → `studies`.

---

## 8. Utang Teknis / Catatan Lanjutan

- **Notes read-only.** Menambah edit-notes membutuhkan endpoint tulis baru di backend (mis. `PATCH /history/{id}`) — di luar 8B.
- **Halaman lain masih placeholder:** Overview (dashboard), Model Metrics (performance), Account (profile).
- **Login page** belum dirancang ulang (dari catatan redesign).

---

## 9. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1–6 | Scaffolding → Frontend Foundation | ✅ |
| — | UI/UX Redesign | ✅ |
| 7 | AI Analysis Workspace | ✅ |
| 8A | Prediction ↔ User Integration + History API | ✅ |
| 8B | Studies Module (History UI) | ✅ |
| — | (kandidat) edit-notes, Model Metrics, redesign login, kontainerisasi Docker | ⏭️ |
