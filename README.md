# MuzuiBot

MuzuiBot adalah Anonymous Chat Telegram Bot yang memungkinkan user mencari partner secara anonim dan saling bertukar pesan tanpa mengetahui identitas masing-masing.

## Fitur
- Anonymous Chat (Text, Photo, Video, Sticker, Voice, dll diteruskan dengan aman)
- Matchmaking berdasarkan Gender Preference dan Kota
- Queue System
- Ready for Vercel Deployment

## Requirements
- Node.js (LTS version, misal v18 atau v20)
- Akun Telegram (untuk mendapatkan Bot Token via BotFather)
- Vercel CLI (Opsional, jika ingin deploy via CLI)

## Instalasi
1. Clone repositori ini.
2. Buka terminal di folder project.
3. Jalankan `npm install`.

## Konfigurasi
1. Copy file `.env.example` menjadi `.env`.
2. Isi `BOT_TOKEN` dengan token bot dari BotFather.
3. (Opsional untuk lokal) Kosongkan `WEBHOOK_URL` jika ingin menjalankan di lokal dengan long-polling.

## Cara Menjalankan Lokal
1. Pastikan `WEBHOOK_URL` di `.env` kosong.
2. Jalankan perintah:
   ```bash
   npm run dev
   ```
3. Bot sudah berjalan dan siap merespons via Telegram!

## Deploy ke Vercel
1. Upload kode ini ke repositori GitHub.
2. Buat project baru di Vercel dan hubungkan dengan repository tersebut.
3. Vercel akan otomatis mengenali konfigurasi dari `vercel.json` dan `package.json`.
4. Di bagian **Environment Variables** Vercel, tambahkan:
   - `BOT_TOKEN`: Token bot kamu.
   - `WEBHOOK_URL`: URL project Vercel kamu (contoh: `https://namaproject.vercel.app`).
5. Deploy project.
6. Webhook akan terpasang secara otomatis ketika endpoint `/api/webhook` dihit pertama kali oleh Telegram, atau kamu dapat trigger webhook setup dengan melakukan request ke url web aplikasi kamu tersebut.
