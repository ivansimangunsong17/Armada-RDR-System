# Dokumentasi Fitur dan Blackbox Testing

Dokumen ini merangkum fitur yang sudah dibangun pada Running Discharge Report System dan daftar pengujian blackbox yang dapat dipakai oleh QA/user acceptance tester. Pengujian dilakukan dari sisi tampilan dan perilaku aplikasi, tanpa melihat kode.

## Ringkasan Sistem

Running Discharge Report System membantu pencatatan discharge truck secara real-time berdasarkan vessel, hatch, destination, checker, dan dokumen lapangan. Data input menjadi sumber untuk monitoring, running report, report shift, report 2 jam, serta export.

Role yang tersedia:

- Admin: mengelola cargo information, final stowage plan, checker assignment, input monitoring, report, dan user management.
- Checker: input data truck, upload foto barcode, melihat riwayat input, mengedit input, dan melihat running report vessel yang ditugaskan.
- Supervisor: melihat dashboard dan report.

## Dokumentasi Fitur

### 1. Login dan Session

Fitur:

- User login menggunakan username atau email.
- Password diverifikasi melalui Supabase Auth.
- Sistem memuat profile user setelah login.
- User inactive ditolak masuk.
- Session dipulihkan saat aplikasi dibuka ulang.
- Logout menghapus session dan kembali ke halaman login.

Aturan:

- Profile user wajib tersedia di tabel `profiles`.
- Profile harus aktif.
- Role user menentukan menu dan halaman default.

### 2. Role Based Navigation

Fitur:

- Admin diarahkan ke `/admin/dashboard`.
- Checker diarahkan ke `/checker/dashboard`.
- Supervisor diarahkan ke `/supervisor/dashboard`.
- Menu berbeda sesuai role.
- Route yang tidak sesuai akan diarahkan ke default route role aktif.

Menu utama Admin:

- Dashboard
- Cargo Information
- Input Monitoring
- Report
- User Management

Menu utama Checker:

- Dashboard
- Input Data
- Riwayat Input
- Running Report

Menu utama Supervisor:

- Dashboard
- Report
- Report 2 Jam
- Report Shift

### 3. Dashboard

Fitur:

- Menampilkan progress discharge dari data Supabase.
- Menampilkan progress gabungan vessel.
- Menampilkan progress tiap kapal.
- Menampilkan detail per hatch untuk kapal yang dipilih.
- Menampilkan update discharge terakhir.

Aturan:

- Admin dan supervisor melihat vessel sesuai akses report.
- Checker melihat vessel yang ditugaskan.
- Jika data belum tersedia, sistem menampilkan empty state.

### 4. Cargo Information

Fitur:

- Admin membuat dan mengubah data operasional vessel.
- Data yang dikelola mencakup vessel name, cargo owner, cargo type, destination, assigned checker, start discharge date, total hatch, status, dan final stowage plan.
- Destination dapat dipilih dari daftar existing atau dibuat baru.
- Satu vessel dapat memiliki lebih dari satu destination aktif.
- Destination pada vessel dapat dinonaktifkan dan diaktifkan ulang.
- Total hatch membentuk input hatch otomatis, misalnya total hatch 5 menghasilkan H1 sampai H5.
- Total cargo dihitung otomatis dari jumlah initial cargo semua hatch.
- Sebelum simpan, sistem menampilkan modal validasi/review perubahan.
- Status vessel dapat diubah dengan modal konfirmasi.

Aturan:

- Vessel name wajib diisi.
- Cargo owner wajib diisi.
- Cargo type wajib diisi.
- Minimal satu destination aktif wajib tersedia.
- Assigned checker wajib dipilih.
- Start discharge date wajib diisi.
- Total hatch minimal 1.
- Initial cargo per hatch wajib diisi dan tidak boleh minus.
- Status tersedia: Pending, Active, Completed.
- Vessel Completed tidak dipakai sebagai input aktif checker.

### 5. Final Stowage Plan

Fitur:

- Final stowage plan tersimpan sebagai initial cargo per hatch.
- Nilai hatch menjadi dasar perhitungan total cargo, remaining cargo, progress, dan estimasi truck.
- Perubahan total hatch menambah atau mengurangi jumlah input hatch.
- Hatch lama yang melebihi total hatch baru dibersihkan saat data disimpan.

Aturan:

- Input angka menggunakan format operasional.
- Contoh input `9999000` tampil sebagai `9,999,000`.
- Nilai disimpan sebagai numeric untuk perhitungan.

### 6. Checker Assignment

Fitur:

- Admin menentukan checker pada Cargo Information.
- Assignment disimpan ke Supabase.
- Checker hanya melihat vessel aktif yang ditugaskan kepadanya.
- Satu checker dapat menangani banyak vessel.

Aturan:

- Assigned checker wajib tersedia sebelum cargo information dapat disimpan.
- Perubahan checker mempengaruhi vessel assignment di halaman checker.

### 7. Input Data Checker

Fitur:

- Checker memilih vessel assignment.
- Checker input data truck berdasarkan hatch dan destination.
- Field yang tersedia: plate number, hatch, tonnage, destination, no surat jalan, no SJ timbangan, gate in date/time, gate out date/time, notes, dan foto struk barcode.
- Plate number otomatis menjadi huruf besar.
- No Surat Jalan memakai prefix tampilan `DT` dan angka dokumen.
- Nomor dokumen berikutnya diisi otomatis berdasarkan vessel.
- Tonnage diformat otomatis saat diketik.
- Gate in dan gate out default ke waktu saat ini tetapi dapat diubah manual.
- Foto barcode opsional.
- Setelah berhasil simpan, form direset dan tabel input terakhir diperbarui.
- Checker dapat mengedit input terakhir lewat modal.
- Sistem memberi peringatan jika input membuat discharge hatch melebihi initial cargo, tetapi data tetap bisa disimpan.

Aturan:

- Vessel assignment wajib ada.
- Hatch wajib dipilih.
- Destination wajib dipilih jika vessel memiliki destination.
- Plate number wajib diisi.
- Tonnage wajib diisi dan lebih dari 0.
- No Surat Jalan wajib diisi dan hanya boleh angka pada input angka.
- No SJ Timbangan wajib diisi dan hanya boleh angka.
- Gate in wajib diisi.
- Gate out wajib diisi.
- Gate out tidak boleh lebih awal dari gate in.
- Foto barcode hanya menerima JPG, JPEG, PNG, atau WebP.
- Ukuran foto maksimal 5 MB.

### 8. Riwayat Input Checker

Fitur:

- Checker melihat riwayat input berdasarkan vessel assignment.
- Data ditampilkan dalam tabel dengan pagination 10 data per halaman.
- Kolom meliputi plat, hatch, tonnage, total netto, no surat jalan, no SJ timbangan, foto barcode, vessel, destination, gate in/out, notes, dan aksi edit.
- Checker dapat mengedit data melalui modal.
- Checker dapat mengganti foto barcode saat edit.
- Jika tidak memilih foto baru, foto lama tetap digunakan.

Aturan:

- Filter vessel hanya berisi vessel assignment milik checker.
- Cancel pada modal tidak mengubah data.
- Save Changes menyimpan koreksi ke Supabase.

### 9. Input Monitoring Admin

Fitur:

- Admin memilih vessel aktif.
- Admin melihat seluruh input checker untuk vessel tersebut.
- Data ditampilkan dengan pagination 10 data per halaman.
- Admin dapat mengedit input checker.
- Admin dapat melihat dan mengganti foto barcode.
- Kolom meliputi gate in/out, checker, plate number, hatch, destination, tonnage, no surat jalan, no SJ timbangan, barcode receipt, notes, dan aksi.

Aturan:

- Data difilter berdasarkan vessel aktif.
- Edit memakai aturan validasi yang sama dengan input checker.
- Tidak ada hard delete.
- Tidak ada void data.

### 10. Running Report

Fitur:

- Menampilkan report progress discharge per vessel.
- Admin dan supervisor dapat memilih vessel.
- Checker melihat running report vessel assignment.
- Report menyimpan pilihan vessel terakhir di browser.
- Menampilkan summary: total cargo, total discharge, remaining cargo, progress, total truck, average load.
- Menampilkan tabel per hatch: initial cargo, discharge, remaining, estimated truck, progress, status, dan total truck.
- Menampilkan status hatch: Normal, Perlu Dipantau, Palka Tertinggal, Critical/Prioritas Utama.
- Menampilkan indikator Over Discharge jika remaining bernilai negatif.
- Menampilkan additional calculation.
- Menampilkan destination summary berdasarkan destination per truck.
- Mendukung Export Excel, Export PDF, dan Print.
- Admin dan supervisor mendapat link ke Report Shift dan Report 2 Jam.

Rumus:

- Total Discharge = jumlah tonnage.
- Total Truck = jumlah input truck.
- Average Load = Total Discharge / Total Truck.
- Remaining Cargo = Initial Cargo - Total Discharge.
- Progress % = Total Discharge / Initial Cargo x 100.
- Est. Truck Requirement = Remaining Cargo / Average Load, dibulatkan ke atas.

Aturan:

- Export disabled jika vessel atau data report belum tersedia.
- Format angka report menggunakan 3 digit desimal.
- Foto barcode tidak ditampilkan di running report.

### 11. Report Shift

Fitur:

- Supervisor dan admin dapat membuka report per shift.
- Filter terdiri dari kapal, tanggal, dan shift.
- Report diambil berdasarkan gate out.
- Hasil dapat diexport ke Excel.

Shift:

- Shift 1: 08.00 - 16.00
- Shift 2: 16.00 - 00.00
- Shift 3: 00.00 - 08.00

Aturan:

- Report hanya dimuat jika filter lengkap.
- Empty state tampil jika data tidak tersedia.

### 12. Report 2 Jam

Fitur:

- Supervisor dan admin dapat membuka report periode 2 jam.
- Filter terdiri dari kapal, tanggal, dan periode.
- Report diambil berdasarkan gate out.
- Hasil dapat diexport ke Excel.

Contoh periode:

- 00.00 - 02.00
- 02.00 - 04.00
- 04.00 - 06.00

Aturan:

- Report hanya dimuat jika filter lengkap.
- Empty state tampil jika data tidak tersedia.

### 13. User Management

Fitur:

- Admin melihat daftar profile user dari Supabase.
- Admin mengedit full name, email, username, role, dan status aktif.
- Username dipakai untuk login lapangan.
- Modal validasi menampilkan perubahan sebelum disimpan.
- Current user tidak dapat menonaktifkan akunnya sendiri.

Aturan:

- User baru belum dibuat dari UI.
- Full name wajib diisi.
- Username opsional, tetapi jika diisi harus 3-32 karakter, diawali huruf/angka, dan hanya berisi huruf kecil, angka, titik, underscore, atau dash.
- Email opsional, tetapi jika diisi harus valid.
- Role tersedia: Admin, Checker, Supervisor.

### 14. Setting Email

Fitur:

- Halaman setting email tersedia sebagai fitur pendukung.
- User dapat menambahkan penerima email.
- Data penerima memuat name, email, position, dan status.
- Status penerima dapat diaktifkan/dinonaktifkan.
- Tersedia aksi test send berbasis tampilan.

Catatan:

- Menu ini masih hidden pada route admin.
- Data awal berasal dari dummy data.
- Integrasi email production belum menjadi scope MVP utama.

### 15. Export

Fitur:

- Running Report dapat diexport ke Excel dan PDF.
- Report Shift dapat diexport ke Excel.
- Report 2 Jam dapat diexport ke Excel.
- Print tersedia pada Running Report.

Aturan:

- Nama file dibuat berdasarkan vessel/report.
- Export membutuhkan data report yang valid.
- Format Excel mengikuti kebutuhan laporan operasional.

### 16. Upload Foto Barcode

Fitur:

- Foto barcode dapat diupload saat input data truck.
- Foto barcode dapat diganti saat edit.
- Foto tampil pada Riwayat Input dan Input Monitoring.
- Upload menggunakan Supabase Storage bucket `truck-barcode-receipts`.

Aturan:

- Foto opsional.
- Format yang diterima: JPG, JPEG, PNG, WebP.
- Maksimal ukuran file 5 MB.
- Jika edit tanpa memilih foto baru, foto lama tetap dipakai.
- Foto lama tidak dihapus dari storage pada MVP.

## Change Request: Multi Cargo dan Multi BL per Vessel

### Latar Belakang

Pada kondisi operasional berikutnya, satu kapal tidak selalu hanya membawa satu cargo. Ada kemungkinan satu vessel memiliki beberapa cargo dan beberapa BL. Contoh:

- Vessel X membawa Cargo A dan Cargo B.
- Cargo A memiliki BL dan perhitungan discharge sendiri.
- Cargo B memiliki BL dan perhitungan discharge sendiri.
- Vessel X tetap membutuhkan perhitungan total keseluruhan gabungan Cargo A dan Cargo B.
- Nomor surat jalan dapat berbeda sequence per cargo/BL, bukan hanya per vessel.

### Kondisi Sistem Saat Ini

Sistem saat ini masih menggunakan model single cargo per vessel:

- `vessels.cargo_owner` dan `vessels.cargo_type` berada langsung di level vessel.
- `hatch_cargo` hanya terhubung ke `vessel_id`.
- `discharge_entries` hanya menyimpan `vessel_id`, `hatch_cargo_id`, dan `destination_id`.
- Unique No Surat Jalan berlaku per vessel.
- Unique No SJ Timbangan berlaku per vessel.
- Running Report dihitung per vessel dan hatch, belum bisa dipisahkan per cargo/BL.

Dampaknya:

- Jika satu vessel memiliki Cargo A dan Cargo B, sistem belum bisa memisahkan FSP Cargo A dan Cargo B.
- Input truck belum bisa menandai cargo/BL mana yang sedang dibawa.
- Report belum bisa menampilkan progress Cargo A sendiri dan Cargo B sendiri.
- Nomor surat jalan belum bisa memiliki sequence berbeda per cargo/BL.

### Rekomendasi Konsep Data Model

Untuk mendukung multi cargo dan multi BL, data cargo perlu dipisahkan dari `vessels` menjadi entitas sendiri.

Entitas yang disarankan:

- `vessels`: menyimpan data kapal dan status operasi utama.
- `vessel_cargos`: menyimpan cargo/BL yang ada pada satu vessel.
- `hatch_cargo`: menyimpan initial cargo per hatch untuk cargo/BL tertentu.
- `discharge_entries`: menyimpan input truck dan wajib mengarah ke cargo/BL tertentu.

Contoh struktur konseptual:

```text
vessels
- id
- vessel_name
- eta
- start_discharge_date
- status

vessel_cargos
- id
- vessel_id
- cargo_owner
- cargo_type
- bl_number
- cargo_label
- destination_id atau relasi multi destination
- delivery_order_prefix
- is_active

hatch_cargo
- id
- vessel_id
- vessel_cargo_id
- hatch_no
- hatch_label
- initial_cargo

discharge_entries
- id
- vessel_id
- vessel_cargo_id
- hatch_cargo_id
- destination_id
- checker_id
- plate_number
- tonnage
- delivery_order_number
- scale_ticket_number
- gate_in_at
- gate_out_at
- barcode_photo_url
- notes
```

### Aturan Bisnis yang Disarankan

- Satu vessel dapat memiliki satu atau lebih cargo.
- Setiap cargo dapat memiliki BL number sendiri.
- Setiap cargo memiliki FSP sendiri per hatch.
- Hatch yang sama dapat memiliki initial cargo untuk Cargo A dan Cargo B.
- Input checker wajib memilih cargo/BL sebelum memilih hatch.
- Pilihan hatch mengikuti cargo/BL yang dipilih.
- Destination dapat tetap di level vessel atau dipindahkan ke level cargo, tergantung proses lapangan.
- Running Report harus dapat difilter:
  - Per vessel keseluruhan.
  - Per cargo/BL.
  - Per destination jika diperlukan.
- Report keseluruhan vessel menjumlahkan seluruh cargo/BL pada vessel tersebut.
- Report cargo/BL hanya menghitung data milik cargo/BL tersebut.
- Nomor surat jalan dapat memiliki sequence per cargo/BL.
- Unique No Surat Jalan sebaiknya berubah dari per vessel menjadi per cargo/BL jika sequence dokumen dipisah.
- Unique No SJ Timbangan perlu dikonfirmasi: tetap per vessel atau per cargo/BL, sesuai aturan dokumen lapangan.

### Dampak ke Fitur

Cargo Information:

- Form perlu berubah dari satu cargo menjadi daftar cargo pada vessel.
- Admin dapat menambah Cargo A, Cargo B, dan seterusnya.
- Setiap cargo memiliki owner, type, BL number, destination, dan FSP sendiri.
- Total cargo vessel dihitung dari total semua cargo.

Input Data Checker:

- Form perlu menambahkan field Cargo/BL.
- Setelah Cargo/BL dipilih, hatch list dan destination mengikuti cargo tersebut.
- Auto-number No Surat Jalan perlu membaca sequence cargo/BL terpilih.
- Warning over discharge dihitung terhadap hatch cargo pada cargo/BL terpilih.

Riwayat Input dan Input Monitoring:

- Tabel perlu menampilkan kolom Cargo/BL.
- Filter tambahan dapat ditambahkan untuk Cargo/BL.
- Edit data harus mengizinkan koreksi Cargo/BL dengan validasi ulang hatch, destination, dan nomor dokumen.

Running Report:

- Report perlu memiliki mode tampilan:
  - Overall Vessel Summary.
  - Cargo/BL Summary.
  - Hatch Summary per Cargo/BL.
- Total vessel tetap menampilkan gabungan seluruh cargo.
- Perhitungan Cargo A dan Cargo B harus terpisah.
- Destination Summary perlu bisa dihitung per cargo dan total vessel.

Report Shift dan Report 2 Jam:

- Filter Cargo/BL perlu tersedia opsional.
- Jika filter Cargo/BL kosong, report menampilkan total vessel.
- Jika Cargo/BL dipilih, report hanya menampilkan data cargo/BL tersebut.

Export:

- Export Running Report perlu mendukung overall vessel dan per cargo/BL.
- Format Excel dapat dibuat dengan section per cargo, lalu grand total vessel.

### Rekomendasi Implementasi Bertahap

Tahap 1 - Fondasi Database:

- Tambah tabel `vessel_cargos`.
- Tambah kolom `vessel_cargo_id` pada `hatch_cargo`.
- Tambah kolom `vessel_cargo_id` pada `discharge_entries`.
- Migrasikan cargo existing menjadi satu row default di `vessel_cargos` untuk setiap vessel.
- Ubah unique constraint dokumen sesuai keputusan bisnis.

Tahap 2 - Cargo Information:

- Ubah UI agar admin bisa mengelola banyak cargo/BL dalam satu vessel.
- FSP diinput per cargo/BL.
- Tampilkan total per cargo dan grand total vessel.

Tahap 3 - Input Checker:

- Tambah field Cargo/BL pada form input.
- Ubah auto-number dokumen menjadi per cargo/BL jika disetujui.
- Ubah validasi over discharge menjadi per cargo/BL dan hatch.

Tahap 4 - Report:

- Ubah view/query report untuk menghasilkan perhitungan per cargo/BL.
- Tambah overall vessel summary.
- Update export Excel/PDF.

Tahap 5 - Testing dan Migrasi Data:

- Validasi backward compatibility untuk vessel lama yang hanya punya satu cargo.
- Pastikan report lama tetap menghasilkan angka sama setelah migrasi.
- Uji vessel dengan lebih dari satu cargo, lebih dari satu BL, dan sequence surat jalan berbeda.

### Keputusan yang Perlu Dikonfirmasi

- Apakah satu cargo selalu sama dengan satu BL, atau satu cargo bisa memiliki lebih dari satu BL?
- Apakah destination mengikuti vessel atau mengikuti cargo/BL?
- Apakah checker assignment tetap per vessel atau bisa berbeda per cargo/BL?
- Apakah No Surat Jalan harus unik per cargo/BL atau tetap unik per vessel?
- Apakah No SJ Timbangan harus unik per cargo/BL atau tetap unik per vessel?
- Apakah satu truck hanya membawa satu cargo/BL, atau bisa membawa campuran cargo?
- Apakah report utama default menampilkan total vessel dulu atau detail per cargo dulu?

## Checklist Blackbox Testing

Gunakan status berikut saat testing: `Pass`, `Fail`, `Blocked`, atau `Not Run`.

### A. Login dan Session

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| AUTH-01 | Login dengan email valid | Masukkan email dan password valid, klik login | User masuk dan diarahkan ke dashboard sesuai role |
| AUTH-02 | Login dengan username valid | Masukkan username dan password valid, klik login | User masuk dan diarahkan ke dashboard sesuai role |
| AUTH-03 | Login password salah | Masukkan identifier valid dan password salah | Muncul pesan gagal login, user tetap di halaman login |
| AUTH-04 | Login user inactive | Login memakai akun dengan `is_active=false` | Login ditolak dengan pesan akun tidak aktif |
| AUTH-05 | Session restore | Login, refresh browser | Session dipulihkan dan user tetap masuk |
| AUTH-06 | Logout | Klik logout | Session terhapus dan user kembali ke login |
| AUTH-07 | Akses route tanpa login | Buka URL dashboard langsung tanpa session | Sistem redirect ke `/login` |

### B. Hak Akses Role

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| ROLE-01 | Menu Admin | Login sebagai admin | Menu admin tampil sesuai role |
| ROLE-02 | Menu Checker | Login sebagai checker | Menu checker tampil: Dashboard, Input Data, Riwayat Input, Running Report |
| ROLE-03 | Menu Supervisor | Login sebagai supervisor | Menu supervisor tampil: Dashboard, Report, Report 2 Jam, Report Shift |
| ROLE-04 | Route tidak sesuai role | Login checker, buka URL admin | Sistem redirect ke default route checker |
| ROLE-05 | Default route | Login setiap role | User masuk ke default dashboard role masing-masing |

### C. Cargo Information

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| CARGO-01 | Load halaman | Admin membuka Cargo Information | Daftar cargo dan form tambah kapal tampil |
| CARGO-02 | Simpan cargo valid | Isi semua field valid, tambah destination, isi FSP, klik Review lalu Confirm Save | Data vessel tersimpan dan muncul di daftar |
| CARGO-03 | Validasi field wajib | Kosongkan vessel name/cargo owner/cargo type/checker/start date | Sistem menampilkan pesan wajib diisi |
| CARGO-04 | Destination kosong | Simpan tanpa destination aktif | Sistem menampilkan pesan minimal satu destination aktif |
| CARGO-05 | Tambah destination existing | Pilih destination existing, klik Add | Destination muncul pada tabel destination form |
| CARGO-06 | Tambah destination baru | Isi Destination Baru, klik Add | Destination baru muncul sebagai active |
| CARGO-07 | Destination duplikat | Tambah destination yang sama dua kali | Sistem menampilkan pesan destination sudah aktif |
| CARGO-08 | Deactivate destination | Klik Deactivate pada destination aktif | Status berubah menjadi Inactive di form |
| CARGO-09 | Reactivate destination | Klik Reactivate pada destination inactive | Status berubah menjadi Active di form |
| CARGO-10 | Total hatch membentuk input | Ubah Total Hatch menjadi 5 | Input H1 sampai H5 tampil |
| CARGO-11 | FSP wajib diisi | Kosongkan salah satu hatch | Sistem menampilkan validasi FSP |
| CARGO-12 | Total cargo otomatis | Isi beberapa hatch | Total Cargo berubah sesuai jumlah hatch |
| CARGO-13 | Review sebelum simpan | Klik Review Cargo Information | Modal validasi menampilkan data yang akan disimpan |
| CARGO-14 | Cancel review | Pada modal review klik Kembali Edit | Data belum tersimpan, kembali ke form |
| CARGO-15 | Edit cargo | Klik Edit pada vessel, ubah data, klik Review Update dan Confirm Save | Perubahan tersimpan di daftar |
| CARGO-16 | Review edit tanpa perubahan | Klik Edit lalu Review tanpa mengubah field | Modal menyatakan tidak ada perubahan dan Confirm Save disabled |
| CARGO-17 | Ubah status vessel | Pilih status berbeda di tabel | Modal konfirmasi tampil |
| CARGO-18 | Confirm status vessel | Klik Confirm Status | Status vessel berubah di daftar |
| CARGO-19 | Cancel status vessel | Tutup modal status | Status vessel tidak berubah |

### D. Input Data Checker

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| INPUT-01 | Load assignment | Login checker dan buka Input Data | Vessel assignment aktif tampil |
| INPUT-02 | Tidak ada assignment | Login checker tanpa assignment aktif | Form disabled/empty state tampil |
| INPUT-03 | Input valid tanpa foto | Isi data valid, klik Simpan Data | Data tersimpan dan muncul di Input Terakhir |
| INPUT-04 | Input valid dengan foto | Pilih file JPG/PNG/WebP valid, simpan | Data tersimpan dan foto dapat dibuka dari riwayat/monitoring |
| INPUT-05 | Plate uppercase | Ketik plate dengan huruf kecil | Plate berubah menjadi huruf besar |
| INPUT-06 | Format tonnage | Ketik `40491` pada tonnage | Field tampil sebagai `40,491` |
| INPUT-07 | Nomor dokumen otomatis | Pilih vessel yang sudah punya input | No Surat Jalan dan No SJ Timbangan berikutnya terisi otomatis |
| INPUT-08 | No Surat Jalan non angka | Isi huruf pada No Surat Jalan | Karakter non angka tidak diterima/validasi muncul |
| INPUT-09 | Field wajib kosong | Kosongkan hatch, plate, tonnage, dokumen, gate time | Sistem menampilkan pesan validasi |
| INPUT-10 | Tonnage nol | Isi tonnage `0` | Sistem menolak dan meminta tonnage lebih dari 0 |
| INPUT-11 | Gate out lebih awal | Isi gate out sebelum gate in | Sistem menolak simpan |
| INPUT-12 | Foto format invalid | Upload file selain JPG/JPEG/PNG/WebP | Sistem menampilkan error format file |
| INPUT-13 | Foto lebih dari 5 MB | Upload file valid tetapi >5 MB | Sistem menampilkan error ukuran file |
| INPUT-14 | Hapus pilihan foto | Pilih foto lalu klik Hapus Pilihan Foto | File terpilih dibersihkan |
| INPUT-15 | Over discharge warning | Isi tonnage melebihi sisa hatch | Warning muncul tetapi tombol simpan tetap dapat digunakan |
| INPUT-16 | Edit input terakhir | Klik Edit, ubah data valid, Save Changes | Data berubah di tabel |
| INPUT-17 | Cancel edit | Klik Edit lalu Cancel | Tidak ada perubahan data |
| INPUT-18 | Ganti foto saat edit | Edit data, pilih foto baru, Save Changes | Foto baru tampil menggantikan foto lama |
| INPUT-19 | Edit tanpa foto baru | Edit data tanpa memilih foto | Foto lama tetap tampil |

### E. Riwayat Input Checker

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| HISTORY-01 | Load riwayat | Checker membuka Riwayat Input | Filter vessel assignment dan tabel tampil |
| HISTORY-02 | Filter vessel | Pilih vessel lain | Tabel berubah sesuai vessel terpilih |
| HISTORY-03 | Pagination next | Data lebih dari 10, klik Next | Halaman berikutnya tampil |
| HISTORY-04 | Pagination prev | Setelah di page 2, klik Prev | Halaman sebelumnya tampil |
| HISTORY-05 | Foto barcode | Klik link foto barcode | Foto dapat dibuka |
| HISTORY-06 | Edit dari riwayat | Klik Edit pada row, ubah data, Save Changes | Data di riwayat berubah |
| HISTORY-07 | Cancel edit riwayat | Buka modal edit lalu Cancel | Data tidak berubah |

### F. Input Monitoring Admin

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| MON-01 | Load monitoring | Admin membuka Input Monitoring | Filter vessel aktif tampil |
| MON-02 | Filter vessel aktif | Pilih vessel | Tabel input checker vessel tersebut tampil |
| MON-03 | Pagination monitoring | Klik Next/Prev | Data berpindah halaman sesuai pagination |
| MON-04 | Edit input checker | Klik Edit, ubah data, Save Changes | Data berubah dan pesan sukses tampil |
| MON-05 | Validasi edit | Kosongkan field wajib di modal edit | Pesan validasi tampil |
| MON-06 | Ganti foto barcode | Pilih foto baru di modal edit | Preview muncul dan foto tersimpan setelah Save Changes |
| MON-07 | Cancel edit admin | Klik Cancel | Tidak ada data yang berubah |
| MON-08 | Empty state | Pilih vessel tanpa input | Tabel menampilkan pesan belum ada input |

### G. Running Report

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| REPORT-01 | Load report admin | Admin membuka Report | Filter kapal dan report tampil |
| REPORT-02 | Load report checker | Checker membuka Running Report | Report vessel assignment tampil tanpa filter global admin |
| REPORT-03 | Pilih kapal | Admin/supervisor memilih kapal lain | Summary dan tabel berubah sesuai kapal |
| REPORT-04 | Summary calculation | Bandingkan total cargo/discharge/remaining/progress dengan data input | Nilai sesuai rumus |
| REPORT-05 | Hatch calculation | Periksa initial cargo, discharge, remaining, progress per hatch | Nilai sesuai data per hatch |
| REPORT-06 | Average load | Total discharge dibagi total truck | Average load sesuai rumus |
| REPORT-07 | Est truck | Remaining cargo dibagi average load, dibulatkan ke atas | Est. Truck sesuai |
| REPORT-08 | Over discharge | Buat data melebihi initial cargo | Badge Over Discharge tampil |
| REPORT-09 | Destination summary | Input truck dengan beberapa destination | Summary per destination sesuai total netto, DT, average |
| REPORT-10 | Export Excel | Klik Export Excel pada report berisi data | File Excel terdownload |
| REPORT-11 | Export PDF | Klik Export PDF pada report berisi data | File PDF terdownload |
| REPORT-12 | Print | Klik Print | Dialog print browser terbuka |
| REPORT-13 | Export disabled tanpa data | Pilih vessel tanpa report | Tombol export disabled atau report empty state tampil |
| REPORT-14 | Persist selected vessel | Pilih vessel, refresh halaman | Vessel terakhir tetap terpilih |

### H. Report Shift

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| SHIFT-01 | Filter belum lengkap | Buka Report Shift tanpa memilih filter lengkap | Report belum dimuat dan instruksi/empty state tampil |
| SHIFT-02 | Shift 1 | Pilih kapal, tanggal, Shift 1 | Data gate out pukul 08.00-16.00 tampil |
| SHIFT-03 | Shift 2 | Pilih Shift 2 | Data gate out pukul 16.00-00.00 tampil |
| SHIFT-04 | Shift 3 | Pilih Shift 3 | Data gate out pukul 00.00-08.00 tampil |
| SHIFT-05 | Export Shift | Klik Export Excel setelah data tampil | File Excel report shift terdownload |
| SHIFT-06 | Empty data shift | Pilih shift tanpa data | Empty state tampil |

### I. Report 2 Jam

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| PERIOD-01 | Filter belum lengkap | Buka Report 2 Jam tanpa filter lengkap | Report belum dimuat dan instruksi/empty state tampil |
| PERIOD-02 | Periode 00-02 | Pilih kapal, tanggal, periode 00.00-02.00 | Data gate out pada periode tersebut tampil |
| PERIOD-03 | Periode lain | Pilih periode lain | Data berubah sesuai periode |
| PERIOD-04 | Export periode | Klik Export Excel setelah data tampil | File Excel report 2 jam terdownload |
| PERIOD-05 | Empty data periode | Pilih periode tanpa data | Empty state tampil |

### J. User Management

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| USER-01 | Load daftar user | Admin membuka User Management | Daftar profile user tampil |
| USER-02 | Edit user valid | Klik Edit, ubah full name/email/username/role/status, Review Changes, Confirm Save | Perubahan tersimpan |
| USER-03 | Full name kosong | Kosongkan Full Name | Validasi wajib diisi tampil |
| USER-04 | Email invalid | Isi email tanpa format email | Validasi format email tampil |
| USER-05 | Username invalid | Isi username kurang dari 3 karakter atau karakter ilegal | Validasi username tampil |
| USER-06 | Username dinormalisasi | Isi username dengan huruf besar lalu blur | Username menjadi huruf kecil |
| USER-07 | Current user inactive disabled | Edit akun yang sedang login | Field status disabled dan akun sendiri tidak bisa dinonaktifkan |
| USER-08 | Review tanpa perubahan | Klik Review tanpa mengubah data | Modal menyatakan tidak ada perubahan dan Confirm Save disabled |
| USER-09 | Cancel edit user | Klik Cancel | Tidak ada perubahan data |

### K. Upload Foto Barcode

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| PHOTO-01 | Upload JPG | Pilih file `.jpg` valid | File diterima |
| PHOTO-02 | Upload JPEG | Pilih file `.jpeg` valid | File diterima |
| PHOTO-03 | Upload PNG | Pilih file `.png` valid | File diterima |
| PHOTO-04 | Upload WebP | Pilih file `.webp` valid | File diterima |
| PHOTO-05 | Upload PDF | Pilih file `.pdf` | File ditolak |
| PHOTO-06 | Upload >5 MB | Pilih file gambar >5 MB | File ditolak |
| PHOTO-07 | Preview edit | Pilih foto baru di modal edit | Preview gambar baru tampil |
| PHOTO-08 | Link foto | Buka link foto pada riwayat/monitoring | Foto terbuka di tab/browser |

### L. Format Angka dan Dokumen

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| FORMAT-01 | Tonnage input | Ketik `26320` | Tampil `26,320` |
| FORMAT-02 | FSP input | Ketik `9999000` pada hatch | Tampil `9,999,000` |
| FORMAT-03 | Report format | Buka Running Report | Angka management tampil 3 digit desimal |
| FORMAT-04 | Surat jalan prefix | Isi No Surat Jalan angka | Tersimpan/tampil dengan prefix `DT` |
| FORMAT-05 | Nomor dokumen berikutnya | Simpan input lalu buka form baru | Nomor dokumen naik ke urutan berikutnya |

### M. Error dan Empty State

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| EMPTY-01 | Tidak ada vessel | Login admin/supervisor saat belum ada vessel | Empty state vessel/report tampil |
| EMPTY-02 | Tidak ada input | Pilih vessel tanpa input discharge | Tabel menampilkan belum ada data |
| EMPTY-03 | Gagal load Supabase | Simulasikan koneksi/database error | Pesan gagal memuat data tampil |
| EMPTY-04 | Gagal simpan | Simulasikan error saat save | Pesan gagal simpan tampil dan modal/form tidak hilang |
| EMPTY-05 | Gagal upload foto | Simulasikan error storage | Pesan gagal upload tampil dan data tidak disimpan tanpa URL foto |

### N. Multi Cargo dan Multi BL

Catatan: checklist ini berlaku setelah change request multi cargo/BL diimplementasikan.

| ID | Skenario | Langkah Test | Expected Result |
|---|---|---|---|
| MCARGO-01 | Buat vessel dengan satu cargo | Admin membuat vessel dengan Cargo A saja | Vessel tersimpan dan tetap kompatibel dengan flow single cargo |
| MCARGO-02 | Buat vessel dengan dua cargo | Admin membuat Vessel X dengan Cargo A dan Cargo B | Kedua cargo tampil di detail vessel |
| MCARGO-03 | Cargo memiliki BL berbeda | Isi BL Cargo A dan BL Cargo B berbeda | BL tersimpan dan tampil pada daftar cargo |
| MCARGO-04 | FSP per cargo | Isi H1-H5 untuk Cargo A dan Cargo B dengan angka berbeda | Total cargo per cargo dan grand total vessel tampil benar |
| MCARGO-05 | Hatch sama untuk cargo berbeda | Isi H1 Cargo A dan H1 Cargo B | Sistem menyimpan kedua nilai sebagai data berbeda |
| MCARGO-06 | Input checker pilih Cargo A | Checker pilih Vessel X, Cargo A, hatch, lalu simpan input | Input tersimpan sebagai discharge Cargo A |
| MCARGO-07 | Input checker pilih Cargo B | Checker pilih Vessel X, Cargo B, hatch, lalu simpan input | Input tersimpan sebagai discharge Cargo B |
| MCARGO-08 | Hatch list mengikuti cargo | Pilih Cargo A lalu Cargo B | Hatch dan initial cargo mengikuti cargo terpilih |
| MCARGO-09 | Destination mengikuti cargo | Pilih cargo dengan destination berbeda | Destination default/list mengikuti cargo terpilih |
| MCARGO-10 | Nomor surat jalan per cargo | Simpan input Cargo A dan Cargo B | Sequence No Surat Jalan berjalan sesuai aturan per cargo/BL |
| MCARGO-11 | Duplicate surat jalan cargo sama | Pakai No Surat Jalan yang sama pada Cargo A | Sistem menolak jika unique per cargo/BL |
| MCARGO-12 | Surat jalan sama cargo berbeda | Pakai No Surat Jalan yang sama pada Cargo A dan Cargo B | Sistem menerima atau menolak sesuai keputusan unique dokumen |
| MCARGO-13 | Over discharge per cargo | Input Cargo A melebihi FSP Cargo A | Warning dihitung hanya terhadap Cargo A |
| MCARGO-14 | Riwayat menampilkan cargo | Buka Riwayat Input | Kolom Cargo/BL tampil pada setiap row |
| MCARGO-15 | Monitoring filter cargo | Admin filter vessel lalu pilih Cargo A | Tabel hanya menampilkan input Cargo A |
| MCARGO-16 | Edit pindah cargo | Edit input dari Cargo A ke Cargo B | Sistem validasi ulang hatch, destination, dan nomor dokumen |
| MCARGO-17 | Running report overall vessel | Buka report Vessel X tanpa filter cargo | Summary menampilkan gabungan Cargo A dan Cargo B |
| MCARGO-18 | Running report per cargo | Filter report ke Cargo A | Summary hanya menghitung Cargo A |
| MCARGO-19 | Report hatch per cargo | Bandingkan H1 Cargo A dan H1 Cargo B | Perhitungan hatch tidak tercampur antar cargo |
| MCARGO-20 | Grand total vessel | Bandingkan total vessel dengan total Cargo A + Cargo B | Grand total sama dengan jumlah seluruh cargo |
| MCARGO-21 | Destination summary per cargo | Filter report ke Cargo A | Destination summary hanya dari input Cargo A |
| MCARGO-22 | Shift report per cargo | Pilih Report Shift dan filter Cargo B | Data shift hanya menampilkan Cargo B |
| MCARGO-23 | Report 2 jam per cargo | Pilih Report 2 Jam dan filter Cargo A | Data periode hanya menampilkan Cargo A |
| MCARGO-24 | Export overall | Export Running Report tanpa filter cargo | File berisi total vessel dan detail per cargo |
| MCARGO-25 | Export per cargo | Export Running Report dengan filter Cargo A | File hanya berisi data Cargo A |
| MCARGO-26 | Backward compatibility | Buka vessel lama hasil migrasi single cargo | Report dan input tetap berjalan dengan satu cargo default |

## Catatan Testing

- Siapkan minimal 3 akun: admin, checker, supervisor.
- Siapkan minimal 1 checker aktif untuk assignment.
- Siapkan minimal 1 vessel aktif dengan beberapa hatch dan destination.
- Untuk change request multi cargo/BL, siapkan minimal 1 vessel dengan Cargo A dan Cargo B, masing-masing memiliki BL dan FSP berbeda.
- Siapkan data truck dengan gate out berbeda untuk menguji report shift dan report 2 jam.
- Siapkan file gambar kecil valid dan file invalid untuk pengujian upload.
- Karena RLS belum diaktifkan pada tahap hardening ini, fokus blackbox testing berada pada perilaku UI, validasi form, filtering data, dan hasil report.
