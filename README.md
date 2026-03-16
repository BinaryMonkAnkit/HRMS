## HRMS Lite

HRMS Lite is a small full‑stack HR tool that lets an admin manage employee records and track daily attendance through a clean web interface.

### Tech stack

- **Frontend**: React (JavaScript) + Vite
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (via `DATABASE_URL`)

### Running the backend locally

1. Make sure you have a PostgreSQL instance running and a database created.
2. Set a PostgreSQL `DATABASE_URL`, for example:
   ```bash
   export DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/hrms_lite
   ```
3. Open a terminal in `backend/`.
4. (Optional but recommended) create and activate a virtualenv.
5. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
6. Start the API:
   ```bash
   uvicorn main:app --reload
   ```
   The API will be available on `http://localhost:8000`.

### Running the frontend locally

1. Open a terminal in `frontend/`.
2. Create a `.env` file and point it to your backend:
   ```bash
   echo VITE_API_BASE_URL=http://localhost:8000 > .env
   ```
3. Install dependencies (already done once, but for a fresh clone):
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

### Deployment overview

- **Backend**:
  - Push the `backend/` folder to a GitHub repo.
  - Deploy to a platform such as Render or Railway using:
    - Start command: `uvicorn main:app --host 0.0.0.0 --port 8000`
    - Environment:
      - `DATABASE_URL` pointing to a managed PostgreSQL instance (for example: `postgresql+psycopg2://user:pass@host:5432/dbname`).
- **Frontend**:
  - Deploy `frontend/` to a static host such as Vercel or Netlify.
  - Set environment variable `VITE_API_BASE_URL` to your deployed backend URL (for example: `https://your-backend.onrender.com`).

### Main features

- Add, list and delete employees (with unique employee ID and email validation).
- Mark attendance as **Present** or **Absent** per day per employee (enforces one record per day).
- View attendance history per employee.
- Optional date filters and per‑employee present/absent summary.

