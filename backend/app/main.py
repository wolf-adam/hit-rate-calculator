from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import require_admin
from .database import initialize_database
from .routes import router
from .settings import get_settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title="Hit Rate Calculator API",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Cards", "description": "Card lookup and card details."},
        {"name": "Catalog", "description": "Available sets, players, and products."},
        {
            "name": "Records",
            "description": "Create, retrieve, and update opening records.",
        },
        {"name": "Analytics", "description": "Aggregated product opening statistics."},
        {"name": "Health", "description": "Service health checks."},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(
    router,
    prefix="/api",
    dependencies=[Depends(require_admin)],
)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
