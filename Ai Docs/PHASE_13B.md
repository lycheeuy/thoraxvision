# Phase 13B — Profile (Frontend)

Antarmuka `/profile` untuk melihat dan mengubah akun pengguna, mengonsumsi Profile API dari Phase 13A. Pengguna dapat memperbarui nama & email, dan mengganti password.

## Ringkasan

Halaman `/profile` sebelumnya hanya placeholder read-only (menampilkan data dari context sebagai bukti auth chain bekerja). Phase 13B menggantinya dengan halaman fungsional penuh: fetch profil via React Query, dua form dengan mutation (update profil & ganti password), umpan balik lewat toast, dan penanganan loading/error konsisten dengan halaman lain.

## Berkas

**Diubah**
- `src/lib/api/types.ts` — menambah `UpdateUserRequest`, `ChangePasswordRequest`, `MessageResponse` (di samping `UserResponse` yang sudah ada).
- `src/app/(app)/profile/page.tsx` — mengganti placeholder lama dengan halaman fungsional.

**Baru**
- `src/services/profile.service.ts` — `ProfileService` (getProfile / updateProfile / changePassword) + singleton `profileService`.
- `src/components/profile/profile-header.tsx` — header presentasional (avatar inisial, nama, username, email, role badge).
- `src/components/profile/personal-information-card.tsx` — form edit full_name & email (local state).
- `src/components/profile/security-card.tsx` — form ganti password (local state + validasi klien).

## Tipe (kontrak dengan backend)

```
UpdateUserRequest    { full_name?: string | null; email?: string | null }
ChangePasswordRequest{ current_password: string; new_password: string }
MessageResponse      { success: boolean; message: string }
```

`UserResponse` (sudah ada): `id`, `username`, `email`, `full_name`, `role`.

## Service

`ProfileService` memakai axios client bersama (`@/lib/api/client`); autentikasi ditangani interceptor client, bukan token manual.

| Method | HTTP | Return |
|--------|------|--------|
| `getProfile()` | GET `/api/v1/users/me` | `UserResponse` |
| `updateProfile(data)` | PUT `/api/v1/users/me` | `UserResponse` |
| `changePassword(data)` | PUT `/api/v1/users/me/password` | `MessageResponse` |

## Komponen

**ProfileHeader** — presentasional. Avatar berbasis inisial (dari `full_name`, fallback `username`; dua kata → inisial depan-belakang, satu kata → dua huruf pertama). Backend belum menyediakan URL avatar, jadi tidak ada field avatar di API/type. Menampilkan nama, `@username`, email, dan role sebagai badge.

**PersonalInformationCard** — form full_name & email dengan state lokal, nilai awal dari `user`. Submit memanggil `onSave({ full_name, email })`; full_name kosong dikirim sebagai `null`, email di-trim. Props `saving` men-disable input & tombol. Tidak melakukan request langsung — parent yang menangani.

**SecurityCard** — form current/new/confirm password dengan state lokal. Validasi klien sebelum submit: new minimal 8 karakter dan new === confirm; gagal → pesan error, callback tidak dipanggil. Payload hanya `{ current_password, new_password }` (confirm tidak dikirim). Form direset setelah callback sukses; bila callback melempar (mis. backend menolak), field dipertahankan.

## Halaman

`ProfilePage` merangkai ketiganya:
- Fetch profil via React Query (`queryKey: ["profile"]`, `retry: false`).
- Loading → `PageSkeleton`; form tidak dirender dengan data kosong.
- Error → `ErrorState` + `refetch()`.
- Layout dibungkus `PageContainer` (pola halaman `(app)`), konten dibatasi lebar sedang.

Dua mutation:
- **updateMutation** → `profileService.updateProfile`; sukses meng-invalidate query `["profile"]` dan toast sukses.
- **passwordMutation** → `profileService.changePassword`; sukses toast sukses, **tidak** meng-invalidate profil (password tidak mengubah `UserResponse`).

Umpan balik lewat toast sonner (`toast.success` / `toast.error`). Error ditampilkan dari `extractApiError` (message dari API), bukan objek error mentah.

## Keputusan desain

- **Query password tidak di-invalidate.** Ganti password tak mengubah data profil, jadi tak perlu refetch.
- **Validasi klien minimal.** Hanya panjang password (min 8) dan kecocokan confirm — sesuai kontrak backend, tanpa aturan kompleksitas tambahan. Validasi asli (password lama benar, email unik) tetap di backend.
- **full_name kosong → null.** Konsisten dengan kolom nullable di backend.
- **Tanpa primitive UI baru.** Memakai `Card`, `Input`, `Label`, `Button`, `Badge` yang sudah ada (pola form login).

## Verifikasi

Type-check `npx tsc --noEmit` bersih untuk keenam berkas (device 2).

Runtime yang perlu diuji di browser: load profil, update nama/email + toast sukses, email bentrok → toast error (409 dari backend), ganti password current salah → toast error, ganti password valid → toast sukses + form reset, validasi lokal new≠confirm → pesan error tanpa memanggil backend.

## Catatan

- Toast memerlukan `<Toaster />` sonner terpasang di layout root; bila toast tak muncul, itu penyebabnya (bukan kode profil).
- `extractApiError` diasumsikan mengembalikan `{ message, detail }` seperti dipakai halaman lain.
- Menguji ganti password sukses benar-benar mengubah password akun; pakai akun uji atau kembalikan.
- Saat menyimpan `page.tsx` dan `security-card.tsx`, pastikan isi tidak tertukar (keduanya diawali `"use client"`; bedakan dari baris berikutnya).
