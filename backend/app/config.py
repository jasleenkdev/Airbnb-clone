import os

DATABASE_URL = os.getenv("APP_DATABASE_URL", "sqlite:///./airbnb.db")
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
# Optional regex so Vercel preview deployments work without listing every URL.
CORS_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX") or None
SEED_ON_STARTUP = os.getenv("SEED_ON_STARTUP", "true").lower() in ("1", "true", "yes")
