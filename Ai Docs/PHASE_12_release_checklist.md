# ThoraxVision — Phase 12: Final Release Checklist

> **Cara pakai.** Centang setiap item saat terverifikasi terhadap lingkungan nyata. Kotak dibiarkan kosong (`□`) bila belum diverifikasi atau belum ada. Tabel Final Approval memakai ✅ Ready / ⚠ Needs Review / ❌ Not Ready berdasarkan status aktual proyek pada akhir Fase 1–12. Item yang menurut audit belum terpenuhi ditandai apa adanya — jangan centang sampai benar-benar terverifikasi.

---

## 1. Backend

- □ Project builds successfully
- □ No import errors  *(uji: `python -c "from app.main import app"` → tanpa error)*
- □ Alembic migrations applied  *(revisi terbaru diterapkan di DB target)*
- □ Environment variables configured  *(`.env` lengkap; tidak ada default lemah)*
- □ Logging works  *(log terstruktur muncul: auth/prediction/ai/storage)*
- □ Error handling works  *(amplop `{success,error{code,message,detail}}`)*
- □ Health endpoint passes  *(`GET /api/v1/health` → 200)*
- □ Dashboard endpoint passes  *(`GET /api/v1/dashboard` → 200, terverifikasi dengan data nyata)*
- □ Prediction endpoint passes  *(`POST /api/v1/predict` → 200)*
- □ History endpoint passes  *(`GET /api/v1/history` & `/{id}` → 200, isolasi kepemilikan)*
- □ Model Insights endpoint passes  *(`GET /api/v1/model-insights` → 200)*

---

## 2. Frontend

- □ npm install succeeds
- □ Production build succeeds  *(`next build` bersih — belum diverifikasi)*
- □ No TypeScript errors  *(`npx tsc --noEmit` bersih — terkonfirmasi per komponen selama pengembangan)*
- □ No ESLint errors  *(belum diverifikasi menyeluruh)*
- □ No React warnings  *(cek Console pada setiap transisi halaman)*
- □ Responsive layout verified  *(Mobile / Tablet / Desktop)*
- □ Loading states verified  *(skeleton per halaman)*
- □ Error states verified  *(ErrorState + retry)*
- □ Empty states verified  *(Studies & Dashboard tanpa data)*

---

## 3. Authentication

- □ Login  *(kredensial benar → token; salah → 401)*
- □ Logout  *(token dibersihkan di klien; ⚠ konfirmasi perilaku server: stateless vs invalidation)*
- □ Protected routes  *(rute `(app)` tanpa token → redirect `/login`)*
- □ Token persistence  *(refresh browser → tetap login sampai kedaluwarsa)*
- □ Unauthorized redirect  *(401 → penanganan sesi habis)*

---

## 4. AI Model

- □ Model loads correctly  *(singleton ModelLoader; log `Model loaded: ...`)*
- □ Metadata loads  *(`metadata.json` terbaca; input_size ternormalisasi)*
- □ Prediction works  *(label + probabilitas dihasilkan)*
- □ GradCAM generated  *(overlay dibuat & dapat dibuka via URL)*
- □ Confidence displayed  *(persen 0–100 di UI)*
- □ Inference time displayed  *(waktu nyata, bukan palsu)*
- □ Invalid image handled  *(tipe tak didukung → 400, tanpa crash)*
- □ **⚠ Bobot model tersedia di lingkungan deploy**  *(`.pth` di-ignore git — pastikan disediakan manual di server)*

---

## 5. Database

- □ PostgreSQL connected  *(probe koneksi berhasil)*
- □ Foreign keys valid  *(`predictions.user_id` → `users`, ON DELETE SET NULL)*
- □ Prediction saved  *(baris baru per prediksi)*
- □ User relation saved  *(prediksi tertaut `user_id` benar)*
- □ Dashboard statistics correct  *(tb + normal = total; hanya milik pengguna)*
- □ Studies retrieved correctly  *(pagination/sort/search/filter; isolasi)*

---

## 6. Model Artifacts

*(di `backend/ml_models/artifacts/`, ter-commit ke git; disajikan via `/static/model-artifacts/`)*

- □ classification_report.txt  *(ter-parse jadi metrics + report)*
- □ confusion_matrix.png  *(dapat dibuka)*
- □ roc_curve.png  *(dapat dibuka)*
- □ training_curves.png  *(dapat dibuka)*
- □ gradcam_example.png  *(dapat dibuka)*
- □ gwo_log.json  *(termuat di panel GWO)*
- □ research_summary_gwo.json  *(termuat di Research Summary)*

---

## 7. Security

- □ JWT configured  *(⚠ verifikasi: SECRET_KEY kuat, masa berlaku wajar, algoritma aman)*
- □ Secrets not committed  *(⚠ verifikasi: `.env`, `.pth`, kredensial tidak ter-commit; ada `.env.example`)*
- □ Upload validation  *(isi/tipe gambar divalidasi)*
- □ File size validation  *(⚠ belum dipastikan ada batas maksimum)*
- □ Extension validation  *(tipe tak didukung ditolak)*
- □ CORS configured  *(⚠ verifikasi: dibatasi ke domain produksi, bukan `*`)*
- □ *(disarankan)* Rate limiting pada auth & predict  *(belum ada)*

---

## 8. Deployment

- □ Dockerfile  *(❌ belum ada / belum teruji)*
- □ docker-compose  *(❌ belum ada / belum teruji)*
- □ .env.production  *(❌ belum ada)*
- □ Production build  *(⚠ backend butuh proses manager, bukan uvicorn --reload)*
- □ Static files  *(mount `/static/uploads` & `/static/model-artifacts` berfungsi lokal)*
- □ Upload directory  *(ada & writable di lingkungan target)*
- □ Model directory  *(`ml_models` + bobot tersedia di server)*
- □ Reverse proxy ready  *(❌ belum ada Nginx/Caddy)*
- □ HTTPS ready  *(❌ belum ada TLS)*

---

## 9. Documentation

- □ README complete  *(⚠ verifikasi kelengkapan)*
- □ Installation guide  *(langkah setup backend+frontend+DB)*
- □ API documentation  *(Swagger `/docs` otomatis tersedia; ⚠ dokumentasi naratif terpisah bila diperlukan)*
- □ Folder structure documented  *(`ARCHITECTURE.md` ada)*
- □ Environment variables documented  *(⚠ buat `.env.example` + daftar variabel)*
- □ Deployment guide  *(❌ belum ada)*

---

## 10. Final Approval

| Category | Status |
|----------|--------|
| Backend | ✅ Ready |
| Frontend | ⚠ Needs Review |
| Authentication | ✅ Ready |
| AI | ✅ Ready |
| Database | ✅ Ready |
| Dashboard | ✅ Ready |
| Studies | ✅ Ready |
| Model Insights | ✅ Ready |
| Deployment | ❌ Not Ready |
| Documentation | ⚠ Needs Review |
| **Overall** | ⚠ **Needs Review** |

*Catatan status:*
- **Frontend ⚠** — fungsional & type-check bersih per komponen, tetapi `next build` / ESLint / audit responsif & aksesibilitas menyeluruh belum diverifikasi.
- **Deployment ❌** — Docker, reverse proxy, HTTPS, proses manager produksi belum ada.
- **Documentation ⚠** — dokumen arsitektur & fase ada; deployment guide & `.env.example` belum.

---

## Kesimpulan

**NOT READY FOR DEPLOYMENT**

*(Untuk rilis ke internet publik. Blocker berada pada Deployment — Docker, reverse proxy, HTTPS, proses manager — serta verifikasi akhir Frontend/Documentation. Untuk demo akademik terkontrol di localhost/jaringan kampus, aplikasi berfungsi penuh dan dapat dipresentasikan.)*
