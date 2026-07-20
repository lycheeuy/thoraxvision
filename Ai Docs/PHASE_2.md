# ThoraxVision — Phase 2: Database Foundation (PostgreSQL + SQLAlchemy + Alembic)

**Status:** ✅ Selesai & terverifikasi (migrasi berjalan, CRUD teruji, /health dengan cek koneksi DB)
**Lingkup:** Fondasi database lengkap untuk FastAPI. Tanpa autentikasi, JWT, upload, prediksi, Grad-CAM, Docker, maupun business logic API.

---

## 1. Tujuan

Membangun lapisan persistence production-ready: koneksi PostgreSQL, engine & session SQLAlchemy 2 (typed style), Base ORM, Alembic untuk migrasi versioned, tiga model ORM inti, generic repository, dependency `get_db`, dan health check yang memverifikasi koneksi database.

---

## 2. File yang Dibuat / Diubah

| File | Isi |
|------|-----|
| `app/core/config.py` | Field `POSTGRES_*` + `SQL_ECHO`; property `database_url` — memakai `DATABASE_URL` bila diisi, atau merakit dari komponen. Driver `postgresql+psycopg` (psycopg 3) |
| `app/infrastructure/database/base.py` | `Base(DeclarativeBase)` + **naming convention** deterministik agar nama constraint/index hasil Alembic stabil |
| `app/infrastructure/database/session.py` | `engine` (`pool_pre_ping=True` — koneksi mati di-recycle otomatis), `SessionLocal`, dependency `get_db()` yang menjamin sesi tertutup per request |
| `app/infrastructure/database/models.py` | Tiga ORM model typed (`Mapped`/`mapped_column`) — lihat §3 |
| `app/infrastructure/repositories/base_repository.py` | `BaseRepository(Generic[ModelT])`: `get`, `list` (paginated), `count`, `create`, `update`, `delete` — fully typed |
| `app/infrastructure/repositories/{user,prediction,model}_repository.py` | Subclass tipis ber-tipe di atas BaseRepository |
| `alembic.ini` | Konfigurasi dasar; `sqlalchemy.url` sengaja kosong (diinjeksi runtime) |
| `alembic/env.py` | Membaca URL dari `settings.database_url` + `Base.metadata` — migrasi selalu konsisten dengan `.env`, kredensial tidak diduplikasi |
| `alembic/versions/20260713_c54ef18a7fd8_initial_tables...py` | Migrasi awal (autogenerate): `users`, `model_information`, `predictions` + index & FK |
| `app/main.py` | `/health` mengeksekusi `SELECT 1`; merespons `degraded` (bukan crash) saat DB mati |
| `.env.example` | Variabel `POSTGRES_*`, `DATABASE_URL`, `SQL_ECHO` |

---

## 3. Model ORM

**`users`** — `id`, `email` (unik), `hashed_password`, `full_name`, `is_active`, `created_at`. (Diperluas di Phase 5: `username`, `role`, `last_login`, `updated_at`.)

**`model_information`** — cermin `metadata.json`: `model_name`, `framework`, `task`, `classes` (JSONB), `input_size`, `threshold`, `version`, `weights_path`, `is_active`, `created_at`.

**`predictions`** — `user_id` & `model_id` (FK `ON DELETE SET NULL`), tiga path citra (original/gradcam/thumbnail), `predicted_label` (index), `confidence`, `inference_time_ms`, `notes`, `created_at` (index).

Keputusan desain: **ORM diletakkan di `infrastructure/`, bukan `domain/entities/`** — model SQLAlchemy terikat framework; domain tetap bebas framework sesuai Clean Architecture.

---

## 4. Perintah

**Pembuatan database (sekali):**
```powershell
psql -U postgres -c "CREATE USER thoraxvision WITH PASSWORD '<password>';"
psql -U postgres -c "CREATE DATABASE thoraxvision OWNER thoraxvision;"
```

**Migrasi:**
```powershell
python -m alembic upgrade head                          # terapkan semua migrasi
python -m alembic revision --autogenerate -m "pesan"    # buat migrasi baru
python -m alembic downgrade -1                          # rollback satu langkah
python -m alembic history                               # lihat rantai revisi
python -m alembic current                               # posisi DB sekarang
```

**Verifikasi:**
```powershell
uvicorn app.main:app --reload --port 8000    # /health -> "database": "connected"
psql -h 127.0.0.1 -U thoraxvision -d thoraxvision -c "\dt"   # 4 tabel (incl. alembic_version)
```

---

## 5. Hasil Verifikasi

- Migrasi awal membentuk `users`, `model_information`, `predictions`, `alembic_version`.
- Smoke test `BaseRepository`: create → get → count → delete berjalan benar.
- `/health` → `connected` saat DB hidup; `degraded/disconnected` saat DB mati (tanpa crash).

---

## 6. Catatan Lingkungan & Insiden (terjadi belakangan, didokumentasikan di sini)

- **Selalu `python -m alembic ...`** (bukan `alembic` langsung) agar dijamin memakai venv aktif, bukan instalasi global.
- Folder migrasi **wajib bernama `alembic/versions/`** (jamak). Insiden nyata: folder ter-rename `version` → Alembic tidak menemukan satu pun revisi (`history` kosong, `Can't locate revision`).
- File `alembic/env.py` dan migrasi awal sempat hilang di mesin lokal; dipulihkan dengan **revision ID yang sama persis** dengan isi tabel `alembic_version` di database. Pelajaran: file migrasi adalah bagian dari kontrak dengan DB — jangan diedit/dihapus, dan lindungi dengan git.
- psql via `localhost` bisa gagal autentikasi karena IPv6 (`::1`) memakai metode auth berbeda — gunakan `psql -h 127.0.0.1 ...`.
- Kepemilikan tabel harus `thoraxvision` (bukan `postgres`), termasuk `GRANT ALL ON ALL SEQUENCES` — jika tidak, INSERT dari aplikasi ditolak `permission denied`.

---

## 7. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1 / 1.1 | Scaffolding + refinement arsitektur | ✅ |
| **2** | **Database (PostgreSQL + SQLAlchemy 2 + Alembic)** | ✅ |
| 3 | AI Inference Engine | ✅ |
| 4 | Prediction API + rollback file | ✅ |
| 5 | Authentication & User Management | ✅ |
| 6 | (berikutnya) | ⏭️ |
