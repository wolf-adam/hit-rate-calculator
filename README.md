# Hit Rate Calculator

A minimal full-stack hit-rate calculator with a Vite React frontend and FastAPI/PostgreSQL backend.

## Requirements

- Node.js 18+
- Python 3.14+
- PostgreSQL connection string

## Backend

The backend uses SQLAlchemy and Pandas. Its local environment is configured in `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database?sslmode=require
```

Create the virtual environment and install dependencies:

```bash
cd backend
python3.14 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

After the initial setup, only the following is needed:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. On startup, missing application tables are created empty; existing tables and data are left unchanged.

### Endpoints

- `GET /api/sets` returns set options.
- `GET /api/records?set_id=1` returns records filtered by set. Pandas is used to transform the result dataframe.
- `POST /api/records` creates a record. `total` is calculated from `ex + ir + sir + special`.

Example request body:

```json
{
	"set_id": 1,
	"name": "New record",
	"ex": 10,
	"ir": 5,
	"sir": 3,
	"special": 2,
	"biggest_hit": 20,
	"price": 12.5
}
```

## Frontend

```bash
cd frontend
# only need during initialization
npm install
npm run dev
```

Open `http://localhost:5173`. The set list is fetched once and cached in local storage. The first available set becomes the default selection; selecting another set fetches its records.

Useful checks:

```bash
npm run lint
npm run build
```
