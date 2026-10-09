import os
import tempfile

# Point the app at a throwaway database before anything imports app.database.
_tmp = tempfile.mkdtemp()
os.environ["APP_DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["SEED_ON_STARTUP"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:  # runs lifespan -> create tables + seed
        yield c
