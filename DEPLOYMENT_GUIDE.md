# Panduan Lengkap: Push ke GitHub & Deploy ke Vercel

Dokumen ini menjelaskan langkah-langkah detail untuk mengunggah (push) kode MuzuiBot ke GitHub dan mendeploy-nya ke Vercel secara gratis.

---

## Langkah 1: Push Project ke GitHub

Sebelum mendeploy ke Vercel, cara paling mudah adalah dengan menghubungkan project kamu ke GitHub agar Vercel bisa mendeteksi perubahan kode secara otomatis (*Auto-deploy*).

### 1. Inisialisasi Git Lokal
Buka terminal (PowerShell atau Command Prompt) di direktori project (`C:\Users\LENOVO\.gemini\antigravity\scratch\muzuibot`), lalu jalankan perintah berikut:

```bash
# Inisialisasi git di folder project
git init

# Tambahkan semua file (node_modules dan .env akan diabaikan otomatis oleh .gitignore)
git add .

# Lakukan commit pertama
git commit -m "Initial commit MuzuiBot"
```

### 2. Buat Repository di GitHub
1. Buka [GitHub](https://github.com/) dan login ke akun kamu.
2. Klik tombol **New** untuk membuat repository baru.
3. Beri nama repository (contoh: `muzuibot`).
4. **PENTING:** Jangan centang "Add a README file", "Add .gitignore", atau "Choose a license" karena kita sudah memilikinya di lokal.
5. Klik **Create repository**.

### 3. Hubungkan Repository Lokal ke GitHub
Salin perintah dari halaman GitHub kamu yang baru dibuat (pada bagian *...or push an existing repository from the command line*), contohnya:

```bash
# Buat branch utama bernama main
git branch -M main

# Hubungkan folder lokal dengan repository GitHub
git remote add origin https://github.com/USERNAME_KAMU/muzuibot.git

# Push kode ke GitHub
git push -u origin main
```

---

## Langkah 2: Deploy ke Vercel

Setelah kode berada di GitHub, ikuti langkah berikut untuk deploy ke Vercel.

### 1. Buat Akun & Import Project
1. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub kamu.
2. Setelah masuk ke Dashboard, klik tombol **Add New...** lalu pilih **Project**.
3. Cari repository `muzuibot` yang baru kamu push tadi, lalu klik **Import**.

### 2. Konfigurasi Environment Variables
Sebelum menekan tombol Deploy, kita perlu memasukkan variabel `.env` ke Vercel agar bot tahu token Telegram-nya.

1. Scroll ke bagian **Environment Variables**.
2. Tambahkan key berikut:
   *   **Key:** `BOT_TOKEN`
   *   **Value:** `TOKEN_BOT_TELEGRAM_KAMU` (diperoleh dari @BotFather)
3. *Catatan:* Untuk variabel `WEBHOOK_URL`, kita kosongkan dulu karena kita belum tahu URL Vercel yang akan diberikan setelah dideploy.

### 3. Klik Deploy
1. Klik tombol **Deploy** dan tunggu proses build selesai (biasanya kurang dari 1 menit).
2. Setelah selesai, kamu akan melihat halaman sukses dengan preview website kamu.
3. Salin URL domain yang diberikan oleh Vercel (contoh: `https://muzuibot-six.vercel.app`).

---

## Langkah 3: Mengaktifkan Webhook Telegram

Agar bot dapat menerima pesan dari Telegram di server Vercel, kita harus mendaftarkan URL Vercel tersebut ke Telegram API (menggunakan Webhook).

1. Kembali ke Dashboard Vercel project kamu, masuk ke tab **Settings** -> **Environment Variables**.
2. Tambahkan environment variable baru:
   *   **Key:** `WEBHOOK_URL`
   *   **Value:** `https://muzuibot-xxx.vercel.app` (gunakan URL asli Vercel kamu tanpa tanda slash `/` di akhir).
3. **PENTING:** Karena Vercel membutuhkan *rebuild* agar variable baru ini terbaca, lakukan redeploy:
   *   Pergi ke tab **Deployments**.
   *   Klik tombol titik tiga `...` di deployment terbaru kamu, lalu klik **Redeploy**.
4. Setelah proses redeploy selesai, buka browser kamu lalu akses URL berikut untuk memicu pendaftaran webhook:
   ```text
   https://muzuibot-xxx.vercel.app/api/webhook
   ```
   *(Ganti `muzuibot-xxx.vercel.app` dengan domain Vercel kamu)*
5. Jika di browser muncul tulisan **MuzuiBot is running!** atau respons sukses lainnya, berarti Webhook telah sukses terpasang!

Sekarang bot kamu sudah aktif di server Vercel secara 24/7 secara gratis! Kamu bisa mengetesnya langsung dengan mengirim pesan ke bot kamu di Telegram.
