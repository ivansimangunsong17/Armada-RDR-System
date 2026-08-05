# Panduan Penggunaan Sistem

Dokumen ini menjelaskan cara menggunakan Running Discharge Report System dari sisi user operasional.

## Ringkasan

Running Discharge Report System digunakan untuk mencatat dan memantau proses discharge truck berdasarkan kapal, hatch, destination, checker, tonnage, dokumen surat jalan, dan waktu gate in/out.

Data yang diinput checker akan menjadi sumber untuk:

- Dashboard progress discharge.
- Input monitoring.
- Running report.
- Report shift.
- Report periode 2 jam.
- Truck duration report.
- Export PDF/Excel jika tersedia pada halaman report.

## Role User

Sistem memiliki 3 role aktif:

| Role | Fungsi Utama |
| --- | --- |
| Admin | Mengelola user, cargo information, vessel, hatch cargo, checker assignment, input monitoring, dan report. |
| Checker | Melakukan input data truck untuk kapal yang ditugaskan, melihat riwayat input, dan melihat running report assignment miliknya. |
| Report Viewer | Melihat dashboard dan report tanpa mengubah data operasional. |

Role lama `supervisor` diperlakukan sebagai `Report Viewer`.

## Login

1. Buka aplikasi frontend.
2. Masukkan username atau email.
3. Masukkan password.
4. Klik `Login`.
5. Sistem akan mengarahkan user ke dashboard sesuai role.

Jika login gagal, periksa:

- username/email sudah benar;
- password sudah benar;
- akun masih aktif;
- backend dan database sedang berjalan.

## Logout

1. Klik tombol `Logout` di sidebar.
2. Sistem akan menghapus session dan kembali ke halaman login.

## Menu Admin

Menu utama Admin:

- Dashboard
- Cargo Information
- Input Monitoring
- Report
- User Management

### Dashboard Admin

Dashboard menampilkan ringkasan progress discharge untuk kapal aktif.

Yang dapat dilihat:

- progress gabungan semua kapal;
- daftar progress kapal;
- detail progress per hatch;
- informasi vessel/cargo;
- update discharge terakhir.

Gunakan dashboard untuk memantau kondisi operasional secara cepat sebelum membuka report detail.

### User Management

Halaman ini digunakan Admin untuk membuat dan mengubah user.

#### Membuat User Baru

1. Buka `User Management`.
2. Klik tombol tambah user.
3. Isi data user:
   - full name;
   - username;
   - email;
   - password;
   - role;
   - status active.
4. Klik review/confirm sesuai modal yang tampil.
5. Pastikan user baru muncul di daftar user.

Catatan:

- Username dipakai untuk login lapangan.
- Email dapat dipakai sebagai alternatif login.
- Role menentukan menu dan akses user.
- User inactive tidak dapat login.

#### Mengubah User

1. Cari user dari daftar.
2. Klik edit.
3. Ubah data yang diperlukan.
4. Review perubahan.
5. Simpan.

Admin tidak disarankan mengubah role akunnya sendiri ketika sedang login.

#### Mengganti Password User

1. Cari user dari daftar.
2. Klik `Change Password`.
3. Isi password baru.
4. Isi konfirmasi password.
5. Klik `Save Password`.

Password lama tidak akan ditampilkan oleh sistem. Setelah password diganti, user harus memakai password baru saat login berikutnya.

### Cargo Information

Halaman ini digunakan untuk membuat dan mengelola data kapal/cargo.

Data utama yang diisi:

- vessel name;
- cargo owner;
- cargo type;
- destination;
- assigned checker;
- start discharge date;
- total hatch;
- initial cargo per hatch;
- status vessel.

#### Membuat Cargo Information Baru

1. Buka `Cargo Information`.
2. Isi informasi kapal.
3. Pilih atau buat destination.
4. Pilih checker yang bertugas.
5. Isi total hatch.
6. Isi initial cargo setiap hatch.
7. Review data pada modal validasi.
8. Simpan.

Aturan penting:

- Vessel name wajib diisi.
- Cargo owner wajib diisi.
- Cargo type wajib diisi.
- Destination wajib tersedia.
- Assigned checker wajib dipilih.
- Total hatch minimal 1.
- Initial cargo tidak boleh minus.

#### Mengubah Cargo Information

1. Pilih kapal dari daftar.
2. Klik edit.
3. Ubah field yang diperlukan.
4. Review perubahan.
5. Simpan.

Jika total hatch diubah, jumlah input hatch akan mengikuti total hatch baru.

#### Mengubah Status Vessel

Status vessel yang tersedia:

- Pending
- Active
- Completed

Gunakan `Active` untuk kapal yang sedang berjalan. Vessel `Completed` tidak dipakai sebagai input aktif checker.

#### Archive Vessel

Archive digunakan untuk menyembunyikan vessel dari daftar aktif tanpa menghapus permanen data historis.

1. Pilih vessel.
2. Klik archive.
3. Konfirmasi aksi.

Data discharge lama tetap tersimpan untuk kebutuhan histori.

### Input Monitoring

Halaman ini digunakan Admin untuk memantau dan mengoreksi input checker.

Alur penggunaan:

1. Buka `Input Monitoring`.
2. Pilih vessel.
3. Gunakan filter/search jika tersedia.
4. Periksa daftar input truck.
5. Klik edit jika ada data yang perlu dikoreksi.
6. Simpan perubahan.

Data yang biasa diperiksa:

- gate in;
- gate out;
- checker;
- plate number;
- hatch;
- destination;
- tonnage;
- delivery order number;
- scale ticket number;
- barcode receipt;
- notes.

### Report Admin

Menu `Report` menampilkan running report untuk vessel aktif.

Admin dapat:

- memilih vessel;
- melihat summary cargo;
- melihat progress per hatch;
- melihat remaining cargo;
- membuka report lanjutan jika link tersedia;
- export atau print report jika tombol tersedia.

## Menu Checker

Menu utama Checker:

- Dashboard
- Input Data
- Riwayat Input
- Running Report

### Dashboard Checker

Dashboard Checker menampilkan progress kapal yang ditugaskan kepada checker tersebut.

Jika tidak ada vessel yang tampil, kemungkinan:

- checker belum di-assign ke vessel;
- vessel belum active;
- vessel sudah completed atau archived.

### Input Data

Halaman ini digunakan checker untuk mencatat data truck keluar.

#### Input Truck Baru

1. Buka `Input Data`.
2. Pilih kapal assignment.
3. Pilih hatch/cargo.
4. Pilih destination jika tersedia.
5. Isi nomor polisi.
6. Isi tonnage.
7. Isi nomor surat jalan.
8. Isi nomor SJ timbangan.
9. Isi waktu gate in/out jika diperlukan.
10. Upload foto barcode/receipt jika tersedia.
11. Isi notes jika ada.
12. Simpan data.

Aturan penting:

- Checker hanya dapat input untuk vessel yang ditugaskan kepadanya.
- Nomor polisi wajib diisi.
- Tonnage wajib lebih dari 0.
- Nomor surat jalan wajib diisi.
- Nomor SJ timbangan wajib diisi.
- Nomor surat jalan dan nomor SJ timbangan tidak boleh duplikat pada vessel yang sama.

### Riwayat Input

Halaman ini digunakan checker untuk melihat dan mengedit input miliknya.

Alur penggunaan:

1. Buka `Riwayat Input`.
2. Pilih vessel.
3. Gunakan filter/search jika diperlukan.
4. Klik edit pada data yang perlu diperbaiki.
5. Simpan perubahan.

Checker hanya dapat melihat dan mengubah data sesuai akses assignment miliknya.

### Running Report Checker

Checker dapat melihat running report untuk vessel yang ditugaskan.

Report ini membantu checker memantau:

- total discharge;
- remaining cargo;
- progress per hatch;
- rata-rata tonnage;
- estimasi kebutuhan truck jika tersedia.

## Menu Report Viewer

Menu utama Report Viewer:

- Dashboard
- Report
- Report 2 Jam
- Report Shift

Report Viewer hanya membaca data dan tidak mengubah data operasional.

### Dashboard Report Viewer

Dashboard menampilkan ringkasan progress vessel aktif.

Gunakan halaman ini untuk monitoring cepat tanpa masuk ke detail input.

### Report

Halaman report menampilkan running report vessel.

Alur penggunaan:

1. Buka `Report`.
2. Pilih vessel.
3. Periksa summary dan detail per hatch.
4. Gunakan export/print jika tersedia.

### Report 2 Jam

Report 2 Jam digunakan untuk melihat discharge berdasarkan periode waktu.

Alur penggunaan:

1. Buka `Report 2 Jam`.
2. Pilih vessel.
3. Pilih tanggal report.
4. Pilih periode jam.
5. Periksa total discharge, total truck, average tonnage, running position, dan destination summary.

### Report Shift

Report Shift digunakan untuk melihat discharge berdasarkan shift kerja.

Alur penggunaan:

1. Buka `Report Shift`.
2. Pilih vessel.
3. Pilih tanggal report.
4. Pilih shift.
5. Periksa summary discharge per hatch.

## Truck Duration Report

Truck Duration Report digunakan untuk melihat durasi truck berdasarkan data gate in dan gate out.

Jika halaman ini tersedia dari link/menu:

1. Pilih vessel.
2. Pilih tanggal jika diperlukan.
3. Periksa detail durasi truck.
4. Periksa repeat truck summary dan single trip summary.

Report ini bergantung pada kelengkapan data gate in dan gate out.

## Upload Barcode/Receipt

Pada input discharge, user dapat mengunggah foto barcode/receipt jika field tersedia.

Ketentuan umum:

- gunakan file gambar;
- pastikan gambar jelas;
- pastikan file sesuai dokumen truck yang sedang diinput;
- upload dilakukan sebelum atau saat menyimpan data input.

Jika upload gagal, periksa koneksi backend dan ukuran/format file.

## Export dan Print

Beberapa halaman report menyediakan tombol export atau print.

Umumnya export digunakan untuk:

- PDF;
- Excel;
- print report.

Pastikan data dan filter sudah benar sebelum export.

## Validasi Umum

Sistem akan menolak data jika:

- field wajib kosong;
- angka tonnage tidak valid;
- initial cargo minus;
- user inactive;
- role tidak memiliki akses;
- nomor dokumen duplikat;
- vessel tidak ditemukan;
- checker mencoba mengakses data milik checker lain.

## Alur Operasional Rekomendasi

### Setup Awal Oleh Admin

1. Login sebagai Admin.
2. Buat user Checker.
3. Buat user Report Viewer jika dibutuhkan.
4. Buat destination.
5. Buat Cargo Information.
6. Isi hatch dan initial cargo.
7. Assign checker.
8. Set vessel menjadi `Active`.

### Operasional Harian Checker

1. Login sebagai Checker.
2. Buka Dashboard atau Input Data.
3. Pilih vessel assignment.
4. Input data truck setiap ada truck keluar.
5. Upload barcode/receipt jika dibutuhkan.
6. Cek Riwayat Input untuk memastikan data tersimpan.

### Monitoring Harian Admin

1. Login sebagai Admin.
2. Cek Dashboard.
3. Buka Input Monitoring untuk memeriksa data checker.
4. Koreksi data jika dibutuhkan.
5. Buka Report untuk melihat progress discharge.

### Monitoring Management/Viewer

1. Login sebagai Report Viewer.
2. Buka Dashboard.
3. Buka Report, Report 2 Jam, atau Report Shift.
4. Export report jika diperlukan.

## Troubleshooting

| Masalah | Kemungkinan Penyebab | Solusi |
| --- | --- | --- |
| Tidak bisa login | Username/password salah atau akun inactive | Hubungi Admin untuk cek akun. |
| Menu tidak sesuai | Role user berbeda | Hubungi Admin untuk koreksi role. |
| Checker tidak melihat kapal | Belum ada assignment atau vessel belum active | Admin perlu assign checker dan set vessel active. |
| Input ditolak | Field wajib belum lengkap atau data duplikat | Periksa pesan error dan lengkapi data. |
| Report kosong | Belum ada vessel/input sesuai filter | Periksa vessel, tanggal, shift, atau periode. |
| Upload gagal | File tidak valid atau backend storage bermasalah | Coba file lain dan cek backend. |
| Data tidak berubah setelah simpan | Request gagal atau koneksi backend terputus | Refresh halaman dan cek pesan error. |

## Catatan Akses

- Jangan membagikan password antar user.
- Gunakan akun masing-masing agar histori input dan audit tetap jelas.
- Logout setelah selesai memakai komputer bersama.
- Untuk perubahan data penting, gunakan review/konfirmasi sebelum menyimpan.
