# Phase 13 — Profile API (Backend)

Self-service profil untuk pengguna yang login: melihat profil, memperbarui profil, dan mengganti password. Semua operasi owner-scoped (hanya diri sendiri) dan wajib autentikasi.

## Ringkasan

Sebelum fase ini, satu-satunya cara membaca identitas pengguna adalah `GET /api/v1/auth/me` (read-only, di router auth). Tidak ada cara memperbarui profil atau mengganti password. Phase 13 menambahkan modul `users` dengan tiga endpoint mandiri.

## Endpoint

Semua di bawah prefix `/api/v1`, tag Swagger **Users**, dan wajib `Bearer` token (via `get_current_active_user`).

| Method | Path | Body | Response | Fungsi |
|--------|------|------|----------|--------|
| GET | `/api/v1/users/me` | — | `UserResponse` | Profil pengguna saat ini |
| PUT | `/api/v1/users/me` | `UpdateUserRequest` | `UserResponse` | Perbarui full_name / email |
| PUT | `/api/v1/users/me/password` | `ChangePasswordRequest` | `MessageResponse` | Ganti password |

## Keputusan desain

**Field yang boleh diperbarui.** `PUT /users/me` hanya mengizinkan `full_name` dan `email`. `username`, `role`, dan `is_active` sengaja di luar cakupan — itu wewenang admin, bukan self-service. Membiarkan pengguna mengubah `role` sendiri adalah lubang keamanan (bisa menaikkan diri jadi admin).

**Keunikan email → 409.** Kolom `email` bersifat unik. Bila pengguna mengubah email ke milik akun lain, service memeriksa lebih dulu lewat `get_by_email` dan melempar `ConflictError` (409) dengan pesan jelas, alih-alih membiarkan error integritas database muncul sebagai 500. Mengubah email ke email sendiri tidak dianggap konflik.

**Aturan password.** Password baru minimal 8 karakter (divalidasi di schema) dan harus berbeda dari password lama (divalidasi di service). Tidak ada aturan kompleksitas tambahan (huruf besar/angka/simbol tidak diwajibkan). Password lama harus diverifikasi benar sebelum penggantian diterima.

**Pemetaan error.** Email bentrok = 409 (`conflict`) — konflik dengan state lain. Password lama salah dan password baru sama dengan lama = 400 (`validation_error`) — input tidak valid. Email format salah dan password terlalu pendek = 422 otomatis dari validasi schema Pydantic.

## Berkas

**Baru**
- `app/api/v1/users.py` — router tiga endpoint. Tipis; setiap endpoint mendelegasikan ke `UserService`. `APIRouter(prefix="/users", tags=["Users"])`.

**Diubah**
- `app/domain/schemas/user.py` — menambah `UpdateUserRequest`, `ChangePasswordRequest`, `MessageResponse` (di samping `UserResponse` yang sudah ada). Import Pydantic menyertakan `EmailStr` dan `Field`.
- `app/services/user_service.py` — menambah method `update_profile(user, data)` dan `change_password(user, current_password, new_password)`.
- `app/core/exceptions.py` — menambah `ConflictError(AppError)` dengan `status_code = 409`, `error_code = "conflict"`.
- `app/api/v1/__init__.py` — mount `users.router`.
- `requirements.txt` — menambah `email-validator` (dependency `EmailStr`).

**Tidak berubah**
- AI engine, prediction, dashboard, history, model-insights.
- Skema database (tidak ada migrasi baru — hanya memakai kolom yang sudah ada).

## Kontrak schema

`UpdateUserRequest`
- `full_name: str | None` (opsional, maks 255)
- `email: EmailStr | None` (opsional, tervalidasi format)

`ChangePasswordRequest`
- `current_password: str` (wajib, min 1)
- `new_password: str` (wajib, min 8, maks 128)

`MessageResponse`
- `success: bool` (default true)
- `message: str`

`UserResponse` (sudah ada, dipakai ulang)
- `id`, `username`, `email`, `full_name`, `role`, `is_active`, `last_login`, `created_at`

## Alur service

`update_profile(user, data)`
1. Jika `email` diberikan dan berbeda dari email saat ini: cari pemakai email itu; jika ditemukan dan bukan diri sendiri → `ConflictError`. Jika aman → set email.
2. Jika `full_name` diberikan → set.
3. Simpan lewat repository (commit + refresh) dan kembalikan user.
Bila body kosong (semua field None), tidak ada perubahan — user dikembalikan apa adanya.

`change_password(user, current_password, new_password)`
1. Verifikasi `current_password` terhadap `hashed_password`; salah → `ValidationError` ("Current password is incorrect.").
2. Jika `new_password` sama dengan password lama → `ValidationError` ("New password must be different...").
3. Hash password baru, simpan.

## Dependency (tidak berubah)

Endpoint memakai provider yang sudah ada di `deps.py`: `get_current_active_user` (rantai `oauth2_scheme → get_current_user → active`) dan `get_user_service`. Exception handler global memetakan `AppError` (termasuk `ConflictError`) ke amplop `{ success, error{ code, message, detail } }` — tidak perlu try/except di router.

## Verifikasi

Diuji terhadap SQLite nyata (service) dan FastAPI TestClient (router). Semua skenario lolos:

Service (11 skenario): update full_name saja, update email ke yang bebas, body kosong = no-op, email bentrok → ConflictError(409), email sendiri bukan konflik, password lama salah → ValidationError, password baru sama → ValidationError, ganti password sukses + terverifikasi + password lama tidak lagi berlaku, isolasi user lain.

Router (12 skenario, via TestClient): GET /me 200, PUT full_name 200, PUT email 200, PUT email bentrok 409 (`code: conflict`), PUT email invalid 422, PUT password current salah 400, PUT password <8 karakter 422, PUT password sama 400, PUT password sukses 200 + persisted, isolasi user lain.

Live di Swagger (device 2): GET /me benar, PUT /me benar, PUT password menolak current yang salah (400), PUT password sukses mengembalikan `{ success: true, message: "Password updated successfully." }`.

## Catatan

- `email-validator` kini dependency backend — tercatat di `requirements.txt` agar setup ulang tidak gagal.
- Live-test password sukses mengubah password akun uji; kembalikan bila akun itu dipakai login rutin.
- Restart uvicorn manual setelah mengubah `__init__.py` (reload sering melewatkannya).

## Langkah berikutnya (frontend Phase 13)

1. Tambah tipe `UpdateUserRequest`, `ChangePasswordRequest`, `MessageResponse` ke `types.ts` frontend (`UserResponse` sudah ada).
2. `profile.service.ts` — getProfile / updateProfile / changePassword memakai ketiga endpoint ini.
3. Halaman & form profil (lihat + edit profil, ganti password).
