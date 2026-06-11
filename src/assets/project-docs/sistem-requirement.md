# Running Discharge Report System (RDRS) - MVP Requirements

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
* Melihat Running Report
* Melihat Report Shift
* Melihat Report 2 Jam
* Download Report Excel

### Checker

Hak akses:

* Login
* Melihat vessel yang ditugaskan
* Input data truck keluar
* Edit data yang sudah tersimpan
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

---

## Form Input Checker

Field input:

* Plate Number
* Tonnage
* Hatch
* No Surat Jalan
* No SJ Timbangan
* Notes

Field otomatis:

* Destination
* Gate Out Date
* Gate Out Time

Aturan:

* No Surat Jalan harus unik per vessel.
* No SJ Timbangan harus unik per vessel.
* Checker dapat mengedit data yang sudah tersimpan.
* Tidak ada hard delete.

---

## Standarisasi Format Angka

Sistem menggunakan format tonnage operasional yang umum digunakan pada kegiatan discharge.

Tujuan:

* Memudahkan checker saat input
* Menghilangkan kebingungan antara titik dan koma
* Menyeragamkan tampilan di seluruh sistem
* Menyamakan tampilan dengan report operasional lapangan

### Aturan Umum

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

### Tampilan Sistem

Semua angka ditampilkan menggunakan format koma:

* 40,491
* 26,320
* 9,999,000
* 49,498,584

Format ini wajib digunakan pada:

* Vessel & Cargo Information
* Final Stowage Plan
* Input Data Checker
* Riwayat Input
* Input Monitoring
* Running Report
* Report Shift
* Report 2 Jam
* Export Excel
* Dashboard

---

## Input Monitoring

Khusus Admin.

Fungsi:

1. Pilih vessel aktif.
2. Lihat seluruh input checker.
3. Edit data jika ada kesalahan.

Data yang ditampilkan:

* Gate Out Date
* Gate Out Time
* Checker
* Plate Number
* Hatch
* Tonnage
* No Surat Jalan
* No SJ Timbangan
* Notes

Tidak ada hard delete.

---

## Perhitungan Sistem

Total Discharge = SUM(Tonnage)

Total DT = Jumlah Truck

Average Load = Total Discharge ÷ Total DT

Remaining Cargo = Initial Cargo − Total Discharge

Progress % = (Total Discharge ÷ Initial Cargo) × 100

---

## Jenis Report

### Running Report

Report utama sistem.

Menampilkan:

* Total Cargo
* Total Discharge
* Remaining Cargo
* Progress %
* Total DT
* Average Load
* Summary per Hatch

### Report Shift

Shift:

* Shift 1: 08.00 - 16.00
* Shift 2: 16.00 - 00.00
* Shift 3: 00.00 - 08.00

### Report Periode 2 Jam

Contoh:

* 00.00 - 02.00
* 02.00 - 04.00
* 04.00 - 06.00

---

## Export

Format:

* Excel (.xlsx)

Tersedia untuk:

* Running Report
* Report Shift
* Report 2 Jam

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

Deployment:

* Vercel

---

## Scope MVP

Fokus MVP:

* Vessel & Cargo Information
* Assign Checker
* Input Data Checker
* Input Monitoring
* Running Report
* Export Excel

Tidak termasuk MVP:

* PDF
* Email Report
* Notifikasi

---

## Phase 2 - Truck Trip Monitoring

Phase 2 ditambahkan sebagai modul terpisah dari MVP utama.

Prinsip implementasi:

* Tidak merombak alur MVP yang sudah berjalan.
* Tidak mengubah Running Report, Report Shift, dan Report 2 Jam pada tahap awal.
* Data input discharge MVP tetap menjadi sumber report utama.
* Monitoring perjalanan truck dibuat sebagai menu dan tabel terpisah.
* Integrasi ke report utama hanya dipertimbangkan setelah Phase 2 stabil dan disetujui.

### Tujuan Phase 2

Memonitor siklus perjalanan truck dari pelabuhan ke gudang, proses timbang di gudang, lalu kembali ke pelabuhan.

Informasi yang dipantau:

* Data gate in dan gate out pelabuhan.
* Data tonnage pelabuhan.
* Data identitas truck dan dokumen jalan.
* Data gate in dan gate out gudang.
* Data tonnage gudang.
* Selisih tonnage pelabuhan dan gudang.
* Durasi perjalanan dan durasi truck berada di gudang.
* Status perjalanan truck.

### Input Checker Pelabuhan

Checker pelabuhan membuat trip baru saat truck tercatat di area pelabuhan.

Field input:

* Foto struk barcode.
* Gate In Pelabuhan.
* Gate Out Pelabuhan.
* Tonnage Pelabuhan.
* Plate Number.
* Hatch.
* No Surat Jalan.
* No SJ Timbangan.

Aturan:

* Plate Number wajib diisi.
* Hatch wajib terhubung ke vessel dan hatch yang sedang aktif.
* No Surat Jalan direkomendasikan unik per vessel.
* No SJ Timbangan direkomendasikan unik per vessel.
* Foto struk barcode disimpan sebagai file attachment, bukan sebagai base64 di tabel utama.
* Gate Out Pelabuhan menjadi titik awal perhitungan durasi perjalanan ke gudang.

### Input Checker Gudang

Checker gudang melengkapi data trip yang sudah dibuat oleh checker pelabuhan.

Field input:

* Gate In Gudang.
* Tonnage / Timbangan Gudang.
* Gate Out Gudang.
* Foto struk timbangan gudang jika ada.
* Notes.

Aturan:

* Checker gudang mencari trip berdasarkan Plate Number, No Surat Jalan, No SJ Timbangan, atau status trip.
* Gate In Gudang wajib lebih besar atau sama dengan Gate Out Pelabuhan.
* Gate Out Gudang wajib lebih besar atau sama dengan Gate In Gudang.
* Foto struk timbangan gudang bersifat opsional.
* Notes digunakan untuk selisih tonnage, kendala operasional, antrean, atau koreksi lapangan.

### Perhitungan Sistem Phase 2

Selisih Tonnage = Tonnage Pelabuhan - Tonnage Gudang

Durasi Pelabuhan ke Gudang = Gate In Gudang - Gate Out Pelabuhan

Durasi Truck di Gudang = Gate Out Gudang - Gate In Gudang

Durasi Truck Kembali ke Pelabuhan = Gate In Pelabuhan berikutnya - Gate Out Gudang sebelumnya

Catatan untuk durasi kembali ke pelabuhan:

* Perhitungan hanya bisa dilakukan jika sistem menemukan trip berikutnya dengan Plate Number yang sama.
* Jika belum ada Gate In Pelabuhan berikutnya, durasi kembali ditampilkan sebagai `Belum kembali`.
* Jika ada jeda operasional yang tidak bisa diverifikasi, status perlu ditandai untuk review.

### Status Perjalanan Truck

Status direkomendasikan:

* `at_port` - truck sudah gate in pelabuhan.
* `departed_port` - truck sudah gate out pelabuhan menuju gudang.
* `arrived_warehouse` - truck sudah gate in gudang.
* `left_warehouse` - truck sudah gate out gudang.
* `returned_port` - truck sudah terdeteksi gate in pelabuhan pada trip berikutnya.
* `completed` - seluruh data wajib trip sudah lengkap.
* `needs_review` - data tidak konsisten, ada selisih besar, atau timestamp tidak valid.

Aturan status:

* Status berubah otomatis mengikuti kelengkapan timestamp.
* Admin atau supervisor dapat memberi tanda `needs_review` jika ada anomali.
* Trip tidak dihapus permanen; koreksi dilakukan melalui edit dan audit trail.

### Menu Baru yang Dibutuhkan

Menu untuk checker pelabuhan:

* Truck Trip - Pelabuhan
* Input Trip Pelabuhan
* Riwayat Trip Pelabuhan

Menu untuk checker gudang:

* Truck Trip - Gudang
* Update Trip Gudang
* Riwayat Trip Gudang

Menu untuk admin/supervisor:

* Truck Trip Monitoring
* Trip Detail
* Trip Exception / Needs Review
* Export Trip Monitoring

Catatan:

* Menu Phase 2 harus dipisahkan dari menu Running Report MVP.
* Dashboard utama MVP tidak wajib berubah.
* Jika diperlukan ringkasan Phase 2, buat dashboard khusus Truck Trip Monitoring.

### Flow Checker Pelabuhan

1. Checker pelabuhan membuka menu `Truck Trip - Pelabuhan`.
2. Pilih vessel aktif dan hatch.
3. Input Plate Number, No Surat Jalan, No SJ Timbangan, tonnage pelabuhan, Gate In Pelabuhan, Gate Out Pelabuhan.
4. Upload foto struk barcode.
5. Sistem membuat record trip dengan status minimal `departed_port` jika Gate Out Pelabuhan sudah terisi.
6. Trip muncul di daftar monitoring untuk checker gudang.
7. Checker pelabuhan dapat melihat riwayat trip yang dibuat dan memperbaiki data sesuai hak akses.

### Flow Checker Gudang

1. Checker gudang membuka menu `Truck Trip - Gudang`.
2. Cari trip berdasarkan Plate Number, No Surat Jalan, No SJ Timbangan, atau daftar truck yang statusnya `departed_port`.
3. Input Gate In Gudang saat truck tiba.
4. Input tonnage gudang dan upload foto struk timbangan gudang jika ada.
5. Input Gate Out Gudang saat truck keluar dari gudang.
6. Tambahkan Notes jika ada selisih, antrean, kerusakan, atau koreksi data.
7. Sistem menghitung selisih tonnage dan durasi gudang.
8. Status trip berubah menjadi `left_warehouse` atau `needs_review` jika ada anomali.

### Rekomendasi Perubahan Database yang Aman

Gunakan tabel baru agar tidak mengganggu tabel MVP `discharge_entries` dan view report utama.

Tabel baru yang direkomendasikan:

```sql
create table public.truck_trips (
  id uuid primary key default gen_random_uuid(),
  vessel_id uuid not null references public.vessels(id),
  hatch_cargo_id uuid references public.hatch_cargo(id),
  port_checker_id uuid references public.profiles(id),
  warehouse_checker_id uuid references public.profiles(id),
  plate_number text not null,
  delivery_order_number text not null,
  port_scale_ticket_number text not null,
  barcode_receipt_url text,
  port_gate_in_at timestamptz,
  port_gate_out_at timestamptz,
  port_tonnage numeric(14, 3) check (port_tonnage >= 0),
  warehouse_gate_in_at timestamptz,
  warehouse_tonnage numeric(14, 3) check (warehouse_tonnage >= 0),
  warehouse_gate_out_at timestamptz,
  warehouse_scale_receipt_url text,
  notes text,
  status text not null default 'at_port',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint truck_trips_delivery_order_per_vessel_unique
    unique (vessel_id, delivery_order_number),
  constraint truck_trips_port_scale_ticket_per_vessel_unique
    unique (vessel_id, port_scale_ticket_number)
);
```

Index yang direkomendasikan:

```sql
create index truck_trips_vessel_id_idx on public.truck_trips (vessel_id);
create index truck_trips_plate_number_idx on public.truck_trips (plate_number);
create index truck_trips_status_idx on public.truck_trips (status);
create index truck_trips_port_gate_out_at_idx on public.truck_trips (port_gate_out_at);
create index truck_trips_warehouse_gate_in_at_idx on public.truck_trips (warehouse_gate_in_at);
```

View terpisah untuk monitoring Phase 2:

```sql
create view public.truck_trip_monitoring as
select
  tt.*,
  (tt.port_tonnage - tt.warehouse_tonnage) as tonnage_difference,
  (tt.warehouse_gate_in_at - tt.port_gate_out_at) as port_to_warehouse_duration,
  (tt.warehouse_gate_out_at - tt.warehouse_gate_in_at) as warehouse_duration
from public.truck_trips tt;
```

Rekomendasi storage:

* Buat bucket Supabase Storage khusus `truck-trip-receipts`.
* Simpan URL atau path file di `barcode_receipt_url` dan `warehouse_scale_receipt_url`.
* Batasi akses upload berdasarkan role checker.

Rekomendasi audit:

* Tambahkan tabel `truck_trip_audit_logs` pada fase implementasi jika koreksi data harus dilacak detail.
* Minimal simpan `created_at`, `updated_at`, `port_checker_id`, dan `warehouse_checker_id`.

### Batasan Phase 2

Belum termasuk:

* Perubahan Running Report utama.
* Perubahan rumus total discharge MVP.
* Integrasi otomatis ke invoice atau billing.
* GPS tracking real-time.
* Notifikasi otomatis.
