# ThoraxVision — Phase 1: Project Scaffolding & Initialization

**Status:** ✅ Selesai
**Tanggal:** Juli 2026
**Lingkup:** Struktur proyek, inisialisasi frontend & backend, konfigurasi dasar. Tanpa autentikasi, database, Docker, endpoint API, maupun logika inferensi (fase berikutnya).

---

## 1. Ringkasan Proyek

ThoraxVision adalah aplikasi web bergaya SaaS untuk deployment model **DenseNet121** (PyTorch, `.pth`) yang mengklasifikasikan citra X-ray dada menjadi **Tuberculosis** dan **Non-Tuberculosis**, dilengkapi explainability **Grad-CAM**.

| Layer    | Teknologi |
|----------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Backend  | FastAPI, SQLAlchemy*, PostgreSQL* |
| AI       | PyTorch, torchvision, pytorch-grad-cam |

\* disiapkan, belum dikonfigurasi (Phase 2+)

---

## 2. Struktur Proyek

```
thoraxvision/
├── README.md                  # Dokumentasi utama proyek
├── .gitignore                 # Pengecualian venv, node_modules, .env, .pth, data runtime
├── .env.example               # Template variabel lingkungan (App/DB/ML/Storage)
├── docs/
│   └── ARCHITECTURE.md        # Aturan Clean Architecture & rencana fase
├── frontend/                  # Next.js 15 App Router
│   ├── package.json           # next 15.5.20, React 19, Tailwind 3.4 + dependensi shadcn
│   ├── tsconfig.json          # TypeScript strict, alias @/* → src/*
│   ├── next.config.ts
│   ├── postcss.config.mjs
│   ├── tailwind.config.ts     # Token warna shadcn (CSS variables)
│   ├── components.json        # Konfigurasi shadcn/ui (style new-york)
│   └── src/
│       ├── app/
│       │   ├── globals.css    # Tema klinis biru-cyan (light + dark)
│       │   ├── layout.tsx     # Root layout + metadata
│       │   └── page.tsx       # Landing page penanda Phase 1
│       ├── components/ui/     # Komponen shadcn (diisi via CLI nanti)
│       └── lib/utils.ts       # Helper cn()
└── backend/                   # FastAPI — Clean Architecture
    ├── requirements.txt       # Dependensi ter-pin (web, DB, ML, test)
    ├── app/
    │   ├── main.py            # Entrypoint FastAPI + CORS + /health
    │   ├── core/config.py     # Settings terpusat (pydantic-settings)
    │   ├── api/v1/            # Presentation layer — router HTTP (Phase 3+)
    │   ├── domain/
    │   │   ├── entities/      # Objek bisnis murni
    │   │   └── schemas/       # Model Pydantic request/response
    │   ├── services/          # Use case / logika aplikasi
    │   ├── infrastructure/
    │   │   ├── database/      # Engine & session SQLAlchemy (Phase 2)
    │   │   └── repositories/  # Implementasi akses data
    │   └── ml/
    │       ├── model/         # Loader & inferensi DenseNet121 (Phase 3)
    │       └── gradcam/       # Generator heatmap Grad-CAM (Phase 4)
    ├── ml_models/             # Lokasi densenet121_tb.pth (git-ignored)
    ├── uploads/               # Citra X-ray yang diunggah
    ├── outputs/gradcam/       # Overlay heatmap hasil Grad-CAM
    ├── reports/               # Laporan analisis yang dihasilkan
    └── tests/                 # Pengujian backend
```

---

## 3. Prinsip Clean Architecture

| Layer | Folder | Tanggung jawab | Boleh mengimpor |
|-------|--------|----------------|-----------------|
| Presentation | `app/api/` | Routing HTTP, wiring request/response | services, schemas |
| Application | `app/services/` | Use case (klasifikasi citra, buat laporan) | domain |
| Domain | `app/domain/` | Entitas & schema, bebas framework | — |
| Infrastructure | `app/infrastructure/`, `app/ml/` | DB, repository, engine PyTorch, Grad-CAM | interface domain |

Aturan:
1. Dependensi hanya mengarah ke dalam. Domain tidak pernah mengimpor FastAPI, SQLAlchemy, atau torch.
2. Services bergantung pada *interface* repository/engine; infrastructure menyediakan implementasi (dependency inversion).
3. Router tetap tipis — validasi via schema, delegasi ke services.

---

## 4. Verifikasi

### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Hasil: `GET /health` → `{"status": "ok", "app": "ThoraxVision", "phase": 1}` ✅

### Frontend
```powershell
cd frontend
npm install
npm run dev
```
Hasil: landing page "ThoraxVision — Phase 1 Project Initialized" di http://localhost:3000 ✅

---

## 5. Catatan Keamanan Dependensi

1. **CVE-2025-66478 (critical RCE, Next.js App Router / RSC)** — versi awal `next@15.3.1` rentan; di-upgrade bertahap dan final di **`next@15.5.20`**, yang menutup seluruh advisory Next.js 2025–2026 (RCE, SSRF, cache poisoning, DoS, XSS).
2. **React 19** ter-resolve ke patch aman (≥ 19.1.4) via range `^19.1.0`.
3. **Known issue (diterima):** 2 vulnerability *moderate* dari `postcss@8.4.31` yang di-pin exact di dalam paket `next` (GHSA-qx2v-qp2m-jg93, XSS pada CSS stringify). `overrides` npm tidak dapat menimpanya karena keterbatasan npm saat paket yang sama juga menjadi direct dependency. Risiko rendah: hanya dipakai saat build-time untuk CSS milik proyek sendiri, tanpa jalur input pengguna. Tindak lanjut: `npm update next` saat rilis patch berikutnya tersedia.
4. Jangan gunakan `npm audit fix --force` — sarannya (downgrade ke `next@9.3.3`) merusak proyek.

### Catatan lingkungan (Windows / PowerShell 5.1)
- Operator `&&` tidak didukung → jalankan perintah satu per satu.
- Aktivasi venv: `.\venv\Scripts\Activate.ps1` (bukan `source`). Jika script diblokir: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`.
- Salin env: `Copy-Item ..\.env.example .\.env` dari folder backend.

---

## 6. Roadmap

- **Phase 1** ✅ Struktur proyek & inisialisasi
- **Phase 2** ⏭️ PostgreSQL + SQLAlchemy + Alembic
- **Phase 3** Endpoint upload + inferensi DenseNet121
- **Phase 4** Visualisasi Grad-CAM
- **Phase 5** Laporan, autentikasi, deployment (Docker)
