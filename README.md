# 💰 Pencatat Keuangan & Analisa AI

Aplikasi **Pencatat Keuangan Personal** berbasis web yang dirancang khusus untuk mempermudah Anda dalam mencatat pemasukan, pengeluaran, utang, piutang, serta menyediakan analisa keuangan mendalam berbasis _Artificial Intelligence_ (AI) dengan Azure OpenAI.

Seluruh data transaksi dan kalkulasi finansial di aplikasi ini didukung oleh infrastruktur solid dengan Framework **Next.js (App Router)**, **PostgreSQL**, dan **Prisma ORM**.

---

## 🌟 Fitur Utama

- **📊 Dashboard Interaktif**: Rekap saldo bersih, sisa pendapatan bulanan, serta visualisasi laba-rugi yang ciamik. 
- **💸 Manajemen Transaksi**: Catat semua transaksi _Pendapatan_ (Income) dan _Pengeluaran_ (Expense) berdasarkan kategori yang dapat di-custom secara tak terbatas.
- **📈 Analisa AI & Rekomendasi Pintar**: Aplikasi dapat otomatis membaca tren keuangan Anda dan memberikan saran-saran objektif mengenai kesehatan kantong.
- **🧾 Scan Nota / Struk (*OCR*)**: Upload gambar struk belanja dan biarkan AI membacanya lalu mengkategorikannya ke daftar pengeluaran.
- **🤝 Utang & Piutang Tracker**: Melacak secara spesifik uang yang Anda pinjamkan (Piutang) maupun utang yang perlu dibayar.
- **🗂️ Bulk Upload via Excel**: Punya catatan keuangan bertahun-tahun di Excel? Anda bisa ekspor massal / bulk upload dalam hitungan detik. 
- **🤖 Terintegrasi Webhook**: Mendukung pelaporan atau tracking log yang terhubung melalui Webhook API Key custom.
- **📱 Responsive UI**: Antarmuka _Glassmorphism_ premium yang terasa *snappy* diakses dari Desktop, MacBook, atau layar HP sekalipun.

---

## 🛠️ Tech Stack & Ekosistem

- **Frontend / Backend**: Next.js 16 (Turbopack)
- **Styling**: TailwindCSS V4 & Modern Vanilla CSS
- **Database Modeler**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Format UI/UX**: _React 19, Lucide React (Icons), Recharts (Graph)_
- **AI Analytics**: Azure OpenAI Integration

---

## 🚀 Panduan Instalasi (Development Lokal)

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi secara lokal di komputer Anda untuk keperluan modifikasi / kontribusi.

### Prasyarat:
Pastikan Anda sudah menginstal:
- [Node.js](https://nodejs.org/en/) versi 20 ke atas.
- [Docker](https://www.docker.com/products/docker-desktop/) (Hanya diperlukan untuk database server dan deployment akhir).
- [Git](https://git-scm.com/)

### Langkah 1: Clone Repositori
```bash
git clone https://github.com/kemalbgskr/CatatUang.git
cd CatatUang/app
```

### Langkah 2: Install Dependensi & Persiapkan Database Postgre via Docker
Pastikan service Docker Desktop Anda sedang **berjalan**, lalu eksekusi database via docker compose dan pasang node modules:
```bash
npm install
docker compose up -d db
```

### Langkah 3: Konfigurasi Environment & Push Schema
Buat file bernama `.env` di folder utama aplikasi (`/app/.env`), dan salin konfigurasi ini:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pencatat_keuangan?schema=public"
WEBHOOK_API_KEY="KEY_WEBHOOK_ANDA"
```
Setelah itu generate Prisma Client dan dorong skema PostgreSQL-nya ke Database lokal:
```bash
npx prisma generate
npx prisma db push
```
*(Opsional)* Anda juga bisa mengisi database kosong Anda melalui script _seeding_ otomatis:
```bash
npm run seed
```

### Langkah 4: Jalankan Server Developent Next.js
Terakhir, operasikan aplikasi Next.js:
```bash
npm run dev
```
Buka browser dan navigasikan ke: [**http://localhost:3000**](http://localhost:3000)

___

## 🐳 Panduan Deployment (Docker Production-Ready)

Aplikasi ini sudah _fully containerized_ dan Docker-ready. Ini adalah cara termudah dan paling konstan jika Anda mengincar deployment satu-klik dengan arsitektur bersih di VPS Anda (seperti AWS EC2, DigitalOcean Droplet, dsb).

Cukup `cd` ke folder *app*, dan satu baris perintah berikut akan menyelesaikan segalanya:
```bash
docker compose up -d --build
```

- **PostgreSQL** akan otomatis didownload konfigurasinya dan berjalan _background_. Data database disimpan aman di folder `/app/data/` (Volume Persistent).
- **Next.js Server** dikonfigurasi melalui Docker `standalone` image minimalis yang di-_mapping_ ke port **3000**.
- Jika Anda harus me-_reset_ konfigurasi atau menghentikannya kelak: `docker compose down`.

___

## ⚙️ Testing

Proyek ini diproteksi dengan unit-test standar secara menyeluruh untuk sistem aritmatik dan validasi datanya menggunakan **Jest**. 
Untuk memvalidasi integrasi (jika Anda memodifikasi kode):

```bash
npm run test
```

## 📜 Lisensi
Dikembangkan dengan ❤️ untuk kemerdekaan finansial.
