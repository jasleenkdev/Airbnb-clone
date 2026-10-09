# One command each:  make backend   |   make frontend   (or `make dev` for both)
.PHONY: backend frontend dev test seed reset-db build

BACKEND_PY := backend/.venv/bin/python

$(BACKEND_PY):
	cd backend && python3 -m venv .venv && .venv/bin/pip install -q -r requirements.txt

frontend/node_modules:
	cd frontend && npm install

backend: $(BACKEND_PY)  ## Run the API on :8000 (creates venv + seeds DB on first run)
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

frontend: frontend/node_modules  ## Run the web app on :3000
	cd frontend && [ -f .env.local ] || cp .env.example .env.local; npm run dev

dev: $(BACKEND_PY) frontend/node_modules  ## Run both (Ctrl+C stops both)
	$(MAKE) -j2 backend frontend

test: $(BACKEND_PY)  ## Backend tests
	cd backend && .venv/bin/pytest -q

reset-db: $(BACKEND_PY)  ## Drop and reseed the SQLite database
	cd backend && .venv/bin/python -m app.seed --reset

build: frontend/node_modules  ## Production build of the frontend (type-check + lint)
	cd frontend && npx eslint . && npm run build
