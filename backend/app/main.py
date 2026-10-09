import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401  (register tables)
from app.config import CORS_ORIGIN_REGEX, CORS_ORIGINS, SEED_ON_STARTUP
from app.database import Base, SessionLocal, engine
from app.routers import bookings, host, listings, meta, reviews, users, wishlist
from app.seed import seed_if_empty
from app.services.errors import DomainError

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(engine)
    if SEED_ON_STARTUP:
        with SessionLocal() as db:
            if seed_if_empty(db):
                logger.info("Database was empty: seeded demo data.")
    yield


app = FastAPI(title="Airbnb Clone API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(DomainError)
async def domain_error_handler(_request: Request, exc: DomainError):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


for r in (users.router, listings.router, bookings.router, host.router, reviews.router, wishlist.router, meta.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health():
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def root():
    return {"name": "Airbnb Clone API", "docs": "/docs", "health": "/api/health"}
