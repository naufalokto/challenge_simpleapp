# Challenge App setup

Aplikasi ini menggunakan FastAPI untuk backend dan React untuk frontend, dengan database PostgreSQL.


yang ter install di komputer saya:
- Python 3.9 atau lebih tinggi
- Node.js dan npm
- PostgreSQL yang sudah berjalan
- Database `simple_app` sudah dibuat

## Setup Backend

di terminal dan masuk ke folder project:

```
cd /Users/macbook/Documents/challenge_appsimple
```

Buat virtual environment Python:

```
python3 -m venv .venv
```

Aktifkan virtual environment:

```
source .venv/bin/activate
```

Install dependencies Python:

```
pip install -r requirements.txt
```

file .env di root folder dan konfigurasi database:

```
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5433/simple_app
```


Jalankan backend server:

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend di http://127.0.0.1:8000. 
Dokumentasi API di http://127.0.0.1:8000/docs.

## Setup Frontend
```
cd /Users/macbook/Documents/challenge_appsimple/frontend
```

Install dependencies Node.js:

```
npm install
```

Jalankan frontend development server:

```
npm start
```

Frontend akan berjalan di http://localhost:3000 

## Konfigurasi Environment Variables

Untuk backend, pastikan file .env sudah dibuat di root folder dengan isi:

```
DATABASE_URL=postgresql+psycopg2://username:password@localhost:port/simple_app
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_API_URL=https://app.sandbox.midtrans.com
```



## Menjalankan Aplikasi
---




