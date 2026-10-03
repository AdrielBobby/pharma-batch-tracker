# MedLedger Frontend

React + TypeScript + Vite dashboard for the Pharma Batch & Expiry Management DBMS microproject.

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

The API base URL is read from `VITE_API_URL` and defaults to `http://localhost:5001/api`.

## Production verification

```bash
npm run build
```

The dependency versions are pinned in `package.json`/`package-lock.json` so the submission build is reproducible.
