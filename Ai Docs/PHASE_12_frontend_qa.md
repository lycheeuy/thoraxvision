# ThoraxVision — Phase 12: Frontend QA Verification Checklist

QA manual untuk setiap halaman yang sudah diimplementasikan. Tanpa perubahan kode. Isi kolom **Status** dengan Pass / Fail / N/A saat menguji. Uji di tiga breakpoint: Mobile (~375px), Tablet (~768px), Desktop (~1280px). Buka DevTools Console selama pengujian untuk memantau warning.

Rute aplikasi berada di route group `(app)` (memerlukan login), kecuali Login yang berada di `(auth)`.

---

## 1. Login — `/login`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/login` terbuka tanpa autentikasi | |
| Rute benar | URL `/login`, bukan redirect ke dashboard saat belum login | |
| Sidebar active | N/A — Login tidak menampilkan sidebar app | |
| Back navigation | Pengguna terautentikasi yang membuka `/login` diarahkan ke dashboard/prediction | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol submit saat proses | Menampilkan status loading; tombol disabled saat request berjalan | |
| Layout stabil | Tidak ada pergeseran layout saat loading | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Form kosong | N/A — form login tidak memiliki empty state data | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Kredensial salah | Pesan error jelas, tidak membocorkan detail sensitif | |
| Backend down | Pesan error jaringan yang ramah | |
| Retry | Pengguna dapat mengubah input dan submit ulang | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Login berhasil | Redirect ke dashboard/prediction; token tersimpan | |
| No overflow | Kartu login tidak overflow | |
| Responsive | Layout benar di semua ukuran | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Form full-width, terbaca | |
| Tablet | Terpusat, proporsional | |
| Desktop | Terpusat, tidak melebar berlebihan | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | Tombol login dapat diklik & via Enter | |
| Input focusable | Field username/password dapat difokus; urutan tab logis | |
| Alt gambar | Logo/ilustrasi memiliki alt atau `aria-hidden` bila dekoratif | |
| Keyboard | Submit via Enter berfungsi | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada warning | |
| Hydration | Tidak ada hydration error | |
| Runtime | Tidak ada error runtime | |

---

## 2. Dashboard — `/dashboard`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/dashboard` terbuka saat terautentikasi | |
| Rute benar | URL `/dashboard` | |
| Sidebar active | Item dashboard/overview aktif | |
| Back navigation | Kembali dari halaman lain memulihkan dashboard | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Skeleton | `DashboardSkeleton` tampil saat fetch | |
| Layout stabil | Struktur skeleton cocok dengan layout final (tanpa jump saat data masuk) | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Belum ada studi | Recent Studies menampilkan "No recent studies." + ikon FolderOpen | |
| Statistik nol | Kartu statistik menampilkan 0, bukan kosong/rusak | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| API gagal | `ErrorState` tampil dengan pesan | |
| Retry | Tombol retry memicu refetch | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Data render | Hero (nama), statistik, recent studies, pipeline, engine, system status terisi | |
| Statistik konsisten | tb + normal = total | |
| Thumbnail | Thumbnail recent studies tampil; fallback saat null | |
| No overflow | Tidak ada overflow pada angka besar / label panjang | |
| Responsive | Grid 2fr/1fr di desktop menumpuk di mobile | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Semua kartu menumpuk 1 kolom | |
| Tablet | Statistik 2 kolom; layout rapi | |
| Desktop | Statistik 4 kolom; recent studies + panel kanan berdampingan | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | "Start new analysis", "Model insights", "View All" berfungsi | |
| Input focusable | N/A — dashboard tanpa input | |
| Alt gambar | Thumbnail memiliki alt (label prediksi) | |
| Keyboard | Baris recent studies & tombol dapat difokus/diaktifkan via keyboard | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada (khususnya key pada list) | |
| Hydration | Tidak ada hydration error | |
| Runtime | Tidak ada error runtime | |

---

## 3. Prediction — `/prediction`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/prediction` terbuka saat terautentikasi | |
| Rute benar | URL `/prediction` (root login mengarah ke sini) | |
| Sidebar active | Item prediction/analysis aktif | |
| Back navigation | "View studies" → `/studies`; "New analysis" mereset workspace | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Saat inferensi | State "running" tampil; timeline/gauge menandai proses | |
| Layout stabil | Tidak ada jump antar state idle → running → complete | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Idle | State idle mengundang unggah gambar | |
| Belum ada gambar | Instruksi unggah jelas | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tipe file salah | Pesan error tipe file | |
| Inferensi gagal | State error dengan pesan; dapat mencoba lagi | |
| Model unavailable | Pesan model tidak tersedia, bukan crash | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Hasil render | Label, confidence, gauge, probabilitas, viewer X-ray + Grad-CAM | |
| Compare/wipe | Penggeser bandingkan original vs Grad-CAM berfungsi | |
| No overflow | Gambar & panel tidak overflow | |
| Responsive | Layout intake:analysis menyesuaikan | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Panel menumpuk; viewer tetap terbaca | |
| Tablet | Proporsi wajar | |
| Desktop | Layout dominan-analisis (mis. 40:60) | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | Unggah, analisis, new analysis, view studies berfungsi | |
| Input focusable | Input file dapat difokus & dipicu via keyboard | |
| Alt gambar | X-ray & Grad-CAM memiliki alt bermakna | |
| Keyboard | Alur unggah → analisis dapat dilalui via keyboard | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada | |
| Hydration | Tidak ada | |
| Runtime | Tidak ada (mis. pointer event pada penggeser) | |

---

## 4. Studies — `/studies`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/studies` terbuka saat terautentikasi | |
| Rute benar | URL `/studies` | |
| Sidebar active | Item Studies aktif | |
| Back navigation | Kembali dari detail memulihkan filter/halaman | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Skeleton | Skeleton tabel tampil saat fetch | |
| Layout stabil | Pindah halaman mempertahankan tata letak (keepPreviousData, tanpa berkedip) | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Belum ada studi | Empty state "belum ada studi" | |
| Filter tak cocok | Empty state varian "tidak ada yang cocok dengan filter" | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| API gagal | ErrorState dengan pesan | |
| Retry | Retry memicu refetch | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Data render | 7 kolom (ID, Thumbnail, Prediction, Confidence, Date, Status, Action) | |
| Search | Search (debounced) menyaring hasil | |
| Filter/sort | Label, tanggal, min confidence, sort bekerja | |
| Pagination | Prev/next + "Showing X–Y of Z" akurat | |
| Status badge | Finding (TB) / Clear (Non-TB) benar | |
| No overflow | Tabel tidak overflow; thumbnail rasio konsisten | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Tabel dapat digulir / menyesuaikan; toolbar tetap terpakai | |
| Tablet | Kolom rapi | |
| Desktop | Semua kolom tampil | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | Open, pagination, filter berfungsi | |
| Input focusable | Search & kontrol filter dapat difokus | |
| Alt gambar | Thumbnail memiliki alt | |
| Keyboard | Navigasi tabel & kontrol via keyboard | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada (key pada baris) | |
| Hydration | Tidak ada | |
| Runtime | Tidak ada | |

---

## 5. Study Detail — `/studies/{id}`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/studies/{id}` terbuka via Open dari daftar | |
| Rute benar | URL berisi id yang benar | |
| Sidebar active | Item Studies tetap aktif | |
| Back navigation | Breadcrumb "Studies" kembali ke daftar | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Skeleton | Skeleton detail tampil saat fetch | |
| Layout stabil | Tidak ada jump saat data masuk | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Notes kosong | "No notes available." | |
| Gambar tak tersedia | Placeholder alih-alih viewer rusak | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Id tidak ada / milik orang lain | "Study not found" + tombol kembali | |
| API gagal | ErrorState | |
| Retry | Tersedia bila relevan | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Data render | Breadcrumb, header studi, viewer (compare), gauge, klasifikasi, info, notes | |
| No overflow | Gambar & panel tidak overflow | |
| Responsive | Viewer & panel menyesuaikan | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Panel menumpuk; viewer terbaca | |
| Tablet | Proporsi wajar | |
| Desktop | Viewer + panel berdampingan | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | Breadcrumb, kontrol viewer berfungsi | |
| Input focusable | N/A / kontrol viewer dapat difokus | |
| Alt gambar | Original & Grad-CAM memiliki alt | |
| Keyboard | Breadcrumb & kontrol dapat dilalui via keyboard | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada | |
| Hydration | Tidak ada | |
| Runtime | Tidak ada | |

---

## 6. Model Insights — `/insights`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/insights` terbuka saat terautentikasi | |
| Rute benar | URL `/insights` | |
| Sidebar active | Item Model Insights aktif | |
| Back navigation | Kembali dari halaman lain berfungsi | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Skeleton | Skeleton tampil saat fetch | |
| Layout stabil | Tidak ada jump saat data masuk | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Artefak hilang | Seksi terkait menampilkan "belum tersedia" (bukan panel rusak) | |
| Gambar gagal muat | Fallback "Figure not available" | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| API gagal | ErrorState dengan pesan | |
| Retry | Retry memicu refetch | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Data render | Hero, overview, metrics (label kualitatif), classification report, confusion/ROC/training, Grad-CAM, GWO, research summary, disclaimer | |
| Angka benar | Metrics cocok dengan classification report | |
| GWO/summary | JSON generik ter-render rapi; array angka panjang diringkas | |
| No overflow | Tabel & gambar tidak overflow | |
| Responsive | Seksi menyesuaikan | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Seksi menumpuk; tabel dapat digulir | |
| Tablet | Proporsi wajar | |
| Desktop | Lebar konten terkontrol | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | "Show all" pada array panjang berfungsi | |
| Input focusable | N/A | |
| Alt gambar | Confusion/ROC/training/Grad-CAM memiliki alt | |
| Keyboard | Kontrol expand dapat dilalui via keyboard | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada (key pada render JSON rekursif) | |
| Hydration | Tidak ada | |
| Runtime | Tidak ada | |

---

## 7. Profile — `/profile`

### Navigation
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Buka halaman | `/profile` terbuka saat terautentikasi | |
| Rute benar | URL `/profile` | |
| Sidebar active | Item Profile/Account aktif | |
| Back navigation | Kembali dari halaman lain berfungsi | |

### Loading State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Saat memuat user | Indikator loading / skeleton bila ada | |
| Layout stabil | Tidak ada jump saat data user masuk | |

### Empty State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Field kosong | Field null (mis. full_name) ditampilkan wajar (— atau username) | |

### Error State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Gagal memuat user | Pesan error / redirect ke login bila tidak terautentikasi | |
| Retry | Tersedia bila relevan | |

### Success State
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Data render | Username, email, full_name, role tampil dari `/auth/me` | |
| No overflow | Nilai panjang tidak overflow | |
| Responsive | Layout menyesuaikan | |

### Responsive
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Mobile | Menumpuk 1 kolom | |
| Tablet | Rapi | |
| Desktop | Terpusat/proporsional | |

### Accessibility
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Tombol clickable | Logout / aksi akun berfungsi | |
| Input focusable | Field (bila ada edit) dapat difokus | |
| Alt gambar | Avatar/ikon memiliki alt atau `aria-hidden` | |
| Keyboard | Aksi dapat dilalui via keyboard | |

### Console
| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| React warning | Tidak ada | |
| Hydration | Tidak ada | |
| Runtime | Tidak ada | |

---

## Pemeriksaan Global (semua halaman)

| Test Item | Expected Result | Status |
|-----------|-----------------|--------|
| Proteksi rute | Halaman `(app)` tanpa login → redirect ke `/login` | |
| Sidebar konsisten | Item aktif selalu mencerminkan halaman saat ini | |
| Token kedaluwarsa | Respons `401` menangani sesi habis (redirect/ pesan) dengan baik | |
| Konsistensi confidence | Persen (0–100) di Prediction, Studies, Dashboard | |
| Tema/warna | Palet konsisten (slate/blue); TB=rose, clear=blue | |
| Refetch dashboard | Interval refresh berjalan tanpa memicu flicker/warning | |
| Tidak ada dead link | Semua tautan sidebar & tombol menuju rute yang ada (mis. `/insights`, bukan `/performance` lama) | |
| Console bersih global | Tidak ada warning/error selama alur end-to-end | |

---

## Catatan QA

- Uji dengan backend hidup (uvicorn) + `npm run dev`.
- Untuk melihat `model.loaded=true` di Dashboard, jalankan satu prediksi lebih dulu di sesi tersebut.
- Uji isolasi data: login sebagai dua pengguna berbeda dan pastikan Studies/Dashboard hanya menampilkan data masing-masing.
- Untuk empty state Studies/Dashboard, gunakan akun tanpa prediksi.
- Periksa Console pada setiap transisi halaman, bukan hanya saat load pertama (hydration error sering muncul saat navigasi).
