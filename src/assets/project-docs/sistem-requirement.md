# Running Discharge Report System (RDRS) - MVP Requirements Updated

## Tujuan Sistem

Membantu proses pencatatan discharge truck secara real-time dan menghasilkan Running Discharge Report secara otomatis tanpa menggunakan Excel manual.

Alur utama sistem:

Vessel & Cargo Information
↓
Assign Checker
↓
Checker Input Data
↓
Input Monitoring
↓
Running Report

---

## Role

### Admin

Hak akses:

* Login
* Kelola Vessel & Cargo Information
* Assign Checker ke Vessel
* Kelola User
* Melihat seluruh input checker
* Mengedit data input checker
* Melihat foto barcode
* Melihat Running Report
* Melihat Report Shift
* Melihat Report 2 Jam
* Download Report Excel

### Checker

Hak akses:

* Login
* Melihat vessel yang ditugaskan
* Input data truck keluar
* Upload foto struk barcode
* Edit data yang sudah tersimpan melalui modal
* Replace foto barcode saat edit
* Melihat Riwayat Input
* Melihat Running Report vessel yang ditugaskan

### Supervisor

Hak akses:

* Login
* Melihat Dashboard
* Melihat Running Report
* Download Report Excel

---

## Vessel & Cargo Information

Admin membuat setup operasional dalam satu halaman.

Field:

* Vessel Name
* Cargo Owner
* Cargo Type
* Destination
* Total Hatch
* ETA
* Start Discharge Date
* Status
* Assigned Checker

Status:

* Pending
* Active
* Completed

---

## Final Stowage Plan

Final Stowage Plan menjadi bagian dari Vessel & Cargo Information.

Admin menginput cargo awal per hatch.

Jika Total Hatch = 5, sistem otomatis menampilkan:

* H1
* H2
* H3
* H4
* H5

Total Cargo dihitung otomatis:

Total Cargo = Σ seluruh hatch

Admin tidak menginput Total Cargo secara manual.

Data ini menjadi dasar seluruh perhitungan progress discharge.

---

## Assign Checker

Admin memilih checker yang akan menangani vessel.

Aturan:

* Satu checker dapat menangani lebih dari satu vessel.
* Checker hanya dapat melihat vessel yang ditugaskan kepadanya.
* Vessel dengan status Completed tidak tampil di Input Data Checker.

---

## Form Input Checker

Field input:

* Plate Number
* Tonnage
* Hatch
* No Surat Jalan
* No SJ Timbangan
* Gate In Date
* Gate In Time
* Gate Out Date
* Gate Out Time
* Foto Struk Barcode
* Notes

Field otomatis:

* Destination
* Created At
* Updated At

Catatan:

* Gate In dan Gate Out diisi manual oleh checker sesuai waktu kejadian lapangan.
* Default tanggal/jam boleh menggunakan waktu saat ini, tetapi tetap bisa diubah.
* Created At adalah waktu data dibuat di sistem.
* Updated At adalah waktu data terakhir diperbarui di sistem.
* Gate Out tetap menjadi dasar Report Shift dan Report 2 Jam.

Aturan:

* No Surat Jalan harus unik per vessel.
* No SJ Timbangan harus unik per vessel.
* Gate In wajib diisi.
* Gate Out wajib diisi.
* Gate Out tidak boleh lebih awal dari Gate In.
* Foto struk barcode bersifat opsional.
* Checker dapat mengedit data yang sudah tersimpan melalui modal.
* Checker dapat mengganti foto barcode saat edit.
* Tidak ada hard delete.
* Tidak ada void data pada MVP.

---

## UI Input Checker

Form Input Checker dibagi menjadi 3 section:

### 1. Truck Information

Berisi:

* Plate Number
* Hatch
* Tonnage
* No Surat Jalan
* No SJ Timbangan
* Notes

Urutan mengikuti pola operasional:

Truck → Cargo → Dokumen

### 2. Operational Timeline

Berisi:

* Gate In Date
* Gate In Time
* Gate Out Date
* Gate Out Time

Visual:

* Gate In menggunakan aksen biru.
* Gate Out menggunakan aksen orange.
* Konsep ini disiapkan agar mudah dikembangkan menjadi Truck Trip Monitoring.

### 3. Documentation

Berisi:

* Upload Foto Struk Barcode
* Preview/link foto barcode

Helper text:

Upload foto struk barcode sebagai bukti dokumen lapangan.

---

## Foto Struk Barcode

Foto barcode masuk ke scope MVP.

Aturan:

* Upload bersifat opsional.
* Format file yang diterima:

  * JPG
  * JPEG
  * PNG
  * WEBP
* Maksimal ukuran file 5 MB.
* File disimpan di Supabase Storage bucket:

truck-barcode-receipts

* URL/path file disimpan di:

discharge_entries.barcode_photo_url

* Foto tampil di:

  * Riwayat Input Checker
  * Input Monitoring Admin

* Foto tidak ditampilkan di Running Report MVP.

Saat edit:

* Jika tidak memilih foto baru, foto lama tetap digunakan.
* Jika memilih foto baru, foto baru diupload dan barcode_photo_url diperbarui.
* Foto lama tidak dihapus dari Storage pada MVP.

---

## Edit Data Checker

Edit data checker menggunakan modal.

Modal edit berisi:

* Plate Number
* Tonnage
* Hatch
* No Surat Jalan
* No SJ Timbangan
* Gate In Date
* Gate In Time
* Gate Out Date
* Gate Out Time
* Notes
* Foto barcode saat ini
* Upload foto barcode baru

Aturan modal:

* Cancel / X Close tidak mengubah data.
* Save Changes menyimpan perubahan ke Supabase.
* Jika update berhasil, modal tertutup dan data refresh.
* Jika update gagal, modal tetap terbuka dan error tampil di dalam modal.
* Tidak ada tombol Delete.
* Tidak ada tombol Void.

---

## Input Monitoring

Khusus Admin.

Fungsi:

1. Pilih vessel aktif.
2. Lihat seluruh input checker.
3. Edit data jika ada kesalahan.
4. Melihat dan mengganti foto barcode.
5. Melihat Gate In dan Gate Out.

Data yang ditampilkan:

* Gate In Date
* Gate In Time
* Gate Out Date
* Gate Out Time
* Checker
* Plate Number
* Hatch
* Tonnage
* No Surat Jalan
* No SJ Timbangan
* Foto Barcode
* Notes

Tidak ada hard delete.

---

## Standarisasi Format Angka

Sistem menggunakan format tonnage operasional yang umum digunakan pada kegiatan discharge.

### Input Operasional

Checker dan Admin cukup mengetik angka tanpa tanda baca.

Contoh:

40491

Sistem otomatis menampilkan:

40,491

### Final Stowage Plan

Admin cukup mengetik angka tanpa tanda baca.

Contoh input:

9999000

Sistem menampilkan:

9,999,000

Contoh:

* H1 = 9,999,000
* H2 = 9,600,000
* H3 = 9,900,000
* H4 = 9,500,000
* H5 = 10,500,000

Total Cargo:

49,499,000

### Input Tonnage Truck

Checker cukup mengetik angka tanpa tanda baca.

Contoh:

40491

Sistem otomatis menampilkan:

40,491

Contoh lain:

* 26320 → 26,320
* 38750 → 38,750
* 50000 → 50,000

### Penyimpanan Database

Nilai tetap disimpan sebagai numeric.

Contoh:

Input User:

40491

Nilai tersimpan:

40.491

Input User:

9999000

Nilai tersimpan:

9999.000

Database tidak mengikuti format tampilan. Format tampilan hanya untuk kebutuhan UI dan report.

---

## Running Report

Report utama sistem.

Menampilkan:

* Total Cargo
* Total Discharge
* Remaining Cargo
* Progress %
* Total Truck
* Average Load
* Total Truck per Hatch
* Est. Truck Requirement
* Summary per Hatch
* Destination Summary

### Total Truck per Hatch

Menggunakan total input truck per hatch.

### Est. Truck Requirement

Rumus:

Est. Truck Requirement = Remaining Cargo ÷ Average Load Overall

Average Load Overall:

Average Load Overall = Total Discharge ÷ Total Truck

Aturan:

* Estimasi truck dibulatkan ke atas.
* Jika Average Load Overall = 0, tampilkan `-`.
* Jika Remaining Cargo <= 0, tampilkan `-` atau `0` sesuai kebutuhan tampilan report.

---

## Format Tampilan Report

Ada perbedaan format antara input operasional dan report management.

### Input / Operasional

Dipakai di:

* Input Data Checker
* Riwayat Input
* Input Monitoring
* Vessel & Cargo Information

Contoh:

* 40,491
* 26,320
* 9,999,000

### Running Report Web

Menggunakan format yang lebih mudah dibaca oleh supervisor/management.

Contoh:

* 40.491 MT
* 9,999.000 MT
* 49,380.320 MT

Tujuan:

* Menghindari salah baca angka besar seperti 49,380,320.
* Membuat report lebih mudah dipahami oleh supervisor, manager, dan owner.

### Export Excel

Export Excel mengikuti format report lapangan yang biasa digunakan.

Contoh:

* 40,491
* 9,999,000
* 49,380,320

Format Excel dibuat mendekati contoh report manual yang sudah digunakan di lapangan.

### Export PDF

PDF belum termasuk MVP utama.

Jika dibuat, PDF menggunakan format clean dan profesional untuk management/client.

---

## Perhitungan Sistem

Total Discharge = SUM(Tonnage)

Total DT = Jumlah Truck

Average Load = Total Discharge ÷ Total DT

Remaining Cargo = Initial Cargo − Total Discharge

Progress % = Total Discharge ÷ Initial Cargo × 100

Est. Truck Requirement = Remaining Cargo ÷ Average Load Overall

---

## Jenis Report

### Running Report

Report utama sistem.

### Report Shift

Shift:

* Shift 1: 08.00 - 16.00
* Shift 2: 16.00 - 00.00
* Shift 3: 00.00 - 08.00

Report Shift menggunakan Gate Out Time sebagai basis pembagian shift.

### Report Periode 2 Jam

Contoh:

* 00.00 - 02.00
* 02.00 - 04.00
* 04.00 - 06.00

Report Periode 2 Jam menggunakan Gate Out Time sebagai basis periode.

---

## Export

Format:

* Excel (.xlsx)

Tersedia untuk:

* Running Report
* Report Shift
* Report 2 Jam

PDF tidak termasuk scope MVP, tetapi dapat menjadi enhancement setelah format report stabil.

---

## Teknologi

Frontend:

* React
* Vite
* Tailwind CSS

Backend:

* Supabase

Database:

* PostgreSQL

Storage:

* Supabase Storage

Deployment:

* Vercel

---

## Scope MVP

Fokus MVP:

* Vessel & Cargo Information
* Assign Checker
* Input Data Checker
* Gate In / Gate Out manual
* Upload Foto Struk Barcode
* Modal Edit Data Checker
* Input Monitoring
* Running Report
* Export Excel

Tidak termasuk MVP:

* PDF
* Email Report
* Notifikasi
* Truck Trip Monitoring Phase 2

---

## Phase 2 - Truck Trip Monitoring

Phase 2 tetap dipisahkan dari MVP utama.

Prinsip implementasi:

* Tidak merombak alur MVP yang sudah berjalan.
* Tidak mengubah Running Report, Report Shift, dan Report 2 Jam pada tahap awal.
* Data input discharge MVP tetap menjadi sumber report utama.
* Monitoring perjalanan truck dibuat sebagai menu dan tabel terpisah.
* Integrasi ke report utama hanya dipertimbangkan setelah Phase 2 stabil dan disetujui.

Fokus Phase 2:

* Gate In Pelabuhan
* Gate Out Pelabuhan
* Gate In Gudang
* Timbangan Gudang
* Gate Out Gudang
* Selisih tonnage pelabuhan dan gudang
* Durasi perjalanan truck
* Status perjalanan truck
* Foto struk gudang
