-Simple App Document

Project ini berisi:

- Backend: `FastAPI` + `SQLAlchemy` + `PostgreSQL`
- Frontend: `React` (create-react-app style)

1. pada struktur saya

- `app/` – kode backend 
  - `main.py` – endpoint API
  - `database.py` – koneksi ke PostgreSQL
  - `models.py` – model ORM (untuk develope relasional database)
  - `schemas.py` – schema Pydantic
- `frontend/` – kode React
- `requirements.txt` – dependency Python
- `frontend/package.json` – dependency frontend

2. Menjalankan backend untuk local

catatan: Python 3.9+, PostgreSQL berjalan dan sudah ada database `simple_app`.

```bash
cd /Users/macbook/Documents/challenge_appsimple

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt



---------------------------------------------------------------------
 (contoh DATABASE_URL, sesuaikan user/password/host/port/db)
export DATABASE_URL="postgresql+psycopg2://postgres:12345@localhost:5433/simple_app"

uvicorn app.main:app --reload
```

Backend berjalan di `http://127.0.0.1:8000` (docs di `http://127.0.0.1:8000/docs`).

### 3. Menjalankan frontend (lokal)

```bash
cd /Users/macbook/Documents/challenge_appsimple/frontend
npm install
npm start
```

Frontend berjalan di `http://localhost:3000` dan berkomunikasi dengan backend di `http://127.0.0.1:8000`.

4. Database & dump

- Database yang dipakai: `simple_app`
- Tabel utama: `items`
- Dump database saya buat via pgAdmin (Backup, format `Custom`) sebagai `simple_app.dump` dan di-restore di 

```bash
createdb simple_app
pg_restore -d simple_app simple_app.dump
```

Setelah restore, sesuaikan `DATABASE_URL` di environment server postgrest bapak 


