# ThoraxVision — Phase 5: Authentication & User Management

**Status:** ✅ Selesai & tervalidasi (43 tes lolos di mesin lokal, tombol Authorize Swagger bekerja)
**Lingkup:** JWT authentication + manajemen user untuk sistem skripsi (tanpa registrasi publik). Tanpa frontend, refresh token, verifikasi email, atau reset password.

---

## 1. Tujuan

Sistem ini hanya untuk keperluan tugas akhir: pengguna adalah **admin, student, supervisor, examiner** — dibuat lewat seeder, bukan registrasi publik. Autentikasi memakai JWT stateless dengan bcrypt untuk password.

---

## 2. Endpoint

| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| POST | `/api/v1/auth/login` | — | OAuth2 form (username + password) → token + objek user |
| GET | `/api/v1/auth/me` | Bearer | User yang sedang login |
| POST | `/api/v1/auth/logout` | Bearer | Stateless — instruksi klien membuang token |

Login memakai **username** (bukan email — email hanya info profil). `LoginResponse` berisi `access_token`, `token_type`, `expires_in` (detik), dan objek `user` lengkap.

---

## 3. File yang Dibuat / Diubah

**Baru**
| File | Isi |
|------|-----|
| `app/core/security.py` | bcrypt hashing (passlib) + JWT encode/decode (python-jose). Fungsi murni tanpa HTTP/DB |
| `app/core/permissions.py` | `Role` enum (4 role), `STAFF_ROLES`, helper `is_admin`/`is_staff`/`has_role`/`is_valid_role` |
| `app/domain/schemas/user.py` | `UserResponse` — tanpa field `hashed_password`, mustahil bocor |
| `app/domain/schemas/auth.py` | `Token`, `LoginResponse` (+user, keputusan #6), `LogoutResponse` |
| `app/services/user_service.py` | `authenticate()` (verifikasi kredensial), `create_user()` (seeder/admin only) |
| `app/services/auth_service.py` | Orkestrasi login: verifikasi → terbitkan JWT (claim username+role) → rakit response |
| `app/api/v1/auth.py` | Route tipis login/me/logout |
| `scripts/seed_users.py` | Seeder idempoten: 4 user default, `python -m scripts.seed_users` |
| `alembic/versions/..._add_auth_fields_to_users.py` | Migrasi reversible (lihat §5) |
| `tests/test_auth.py` + `tests/test_permissions.py` | 24 tes |

**Diubah**
| File | Perubahan |
|------|-----------|
| `database/models.py` | `User` + `username` (unik), `role` (String), `last_login`, `updated_at` |
| `api/deps.py` | `oauth2_scheme` → `get_current_user` → `get_current_active_user` → `require_roles(...)` |
| `api/error_handlers.py` | 401 kini menyertakan header `WWW-Authenticate: Bearer` |
| `repositories/user_repository.py` | `get_by_username`, `get_by_email`, `touch_last_login` |
| `core/config.py` | `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` |
| `core/exceptions.py` | +5 exception auth (401/403) |
| `requirements.txt` | `passlib[bcrypt]==1.7.4`, `bcrypt==4.0.1`, `python-jose[cryptography]==3.3.0` |

---

## 4. Keputusan Desain

1. **Role sebagai String, bukan PostgreSQL ENUM** — menambah role baru tidak butuh migrasi `ALTER TYPE`; validasi di `permissions.py`.
2. **Satu error untuk username tak dikenal & password salah** (`invalid_credentials`) — mencegah user enumeration.
3. **`UserResponse` tidak mendeklarasikan `hashed_password`** — Pydantic `from_attributes` hanya mengambil field terdeklarasi, jadi hash mustahil terserialisasi.
4. **Logout stateless** — server tanpa sesi; endpoint tetap butuh auth agar jujur, dan responsnya menginstruksikan klien membuang token.
5. **`tokenUrl="/api/v1/auth/login"`** pada `OAuth2PasswordBearer` — inilah yang membuat tombol Authorize Swagger tahu ke mana harus login.
6. **`require_roles(...)` sebagai dependency factory** — proteksi role per-endpoint: `Depends(require_roles(Role.ADMIN.value))`.
7. **`last_login`** di-update di `authenticate()` setelah verifikasi sukses (keputusan #7).

---

## 5. Migrasi Alembic (reversible & aman)

Autogenerate mentah membuat `username`/`role` NOT NULL langsung — **gagal** jika tabel sudah berisi baris. Migrasi ditulis ulang dengan pola aman:

1. Tambah kolom sebagai **nullable**
2. **Backfill** baris lama (`role='student'`, `username='user_'||id`)
3. **Promosikan** ke NOT NULL
4. Buat index (`ix_users_username` unik, `ix_users_role`)

`downgrade()` menghapus index + keempat kolom. Teruji maju → mundur → maju.

---

## 6. Seeder

```powershell
python -m scripts.seed_users
```

| Username | Password | Role |
|----------|----------|------|
| admin | Admin123! | admin |
| student | Student123! | student |
| supervisor | Supervisor123! | supervisor |
| examiner | Examiner123! | examiner |

Idempoten: run kedua → `0 created, 4 skipped`. Password default hanya untuk pengembangan lokal.

---

## 7. Error Handling

| Kondisi | HTTP | error.code |
|---------|------|-----------|
| Username/password salah | 401 | `invalid_credentials` |
| Token invalid/kedaluwarsa | 401 | `invalid_token` |
| Tanpa token | 401 | `authentication_error` (+ `WWW-Authenticate: Bearer`) |
| Akun nonaktif | 403 | `inactive_user` |
| Role tidak memenuhi | 403 | `permission_denied` |

Semua memakai envelope error tunggal dari Phase 4.

---

## 8. Hasil Validasi

- **pytest: 43 passed** di mesin lokal (24 tes auth + permission: login sukses/gagal, /me, endpoint terproteksi tanpa/dengan token rusak, token kedaluwarsa, logout, vocabulary role, `require_roles`).
- **Swagger Authorize** bekerja: login `student` → `/me` 200; logout → `/me` 401.
- Seeder: `4 created, 0 skipped` lalu `0 created, 4 skipped`; empat baris di tabel `users`.
- `last_login` terisi setelah login; `hashed_password` tidak pernah muncul di response.

---

## 9. Catatan Lingkungan — masalah yang ditemui & solusinya

- **File `alembic/env.py` & migrasi Phase 2 hilang** + folder salah nama `version` (harusnya `versions`) → rantai revisi putus (`Can't locate revision`). Solusi: rename folder, pulihkan `env.py` dan file migrasi awal dengan revision ID yang sama persis dengan isi tabel `alembic_version`.
- **File salah nama `permission.py`** (harusnya `permissions.py`) → `ModuleNotFoundError`. Solusi: `Rename-Item`.
- **Pelajaran utama: gunakan git sejak awal** — semua insiden di atas pulih dalam sedetik dengan `git checkout`.
- `python -m alembic ...` dan `python -m pip ...` (bukan `alembic`/`pip` langsung) menjamin perintah berjalan dari venv aktif.
- Warning `datetime.utcnow deprecated` berasal dari internal python-jose — aman diabaikan.

---

## 10. Utang Teknis untuk Fase Berikutnya

- `POST /api/v1/predict` **masih terbuka tanpa auth** — kandidat pertama fase berikutnya: `Depends(get_current_active_user)` + isi `user_id` pada baris prediksi.
- Endpoint history/dashboard/performance/model belum diimplementasikan (placeholder).
- `JWT_SECRET_KEY` wajib diganti nilai acak di `.env` (`python -c "import secrets; print(secrets.token_hex(32))"`).

---

## 11. Roadmap

| Phase | Lingkup | Status |
|-------|---------|--------|
| 1 / 1.1 | Scaffolding + refinement arsitektur | ✅ |
| 2 | Database (PostgreSQL + SQLAlchemy + Alembic) | ✅ |
| 3 | AI Inference Engine | ✅ |
| 4 | Prediction API + rollback file | ✅ |
| 5 | Authentication & User Management | ✅ |
| 6 | (berikutnya — mis. proteksi /predict + history) | ⏭️ |
