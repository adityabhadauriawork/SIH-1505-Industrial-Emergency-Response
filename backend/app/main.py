from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.site.site_service import site_service

# Import API routers
from app.api.routes_site import router as site_router
from app.api.routes_chemicals import router as chemicals_router
from app.api.routes_scenarios import router as scenarios_router
from app.api.routes_hazard import router as hazard_router
from app.api.routes_impact import router as impact_router
from app.api.routes_evacuation import router as evacuation_router
from app.api.routes_resources import router as resources_router
from app.api.routes_preplan import router as preplan_router
from app.api.routes_weather import router as weather_router
from app.api.routes_intelligence import router as intelligence_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Seed initial plant and chemical data
    db = SessionLocal()
    try:
        site_service.load_seed_data_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="SIH 1505 Industrial Hazard Simulation & Emergency Response Command Center API",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(site_router, prefix=settings.API_V1_STR)
app.include_router(chemicals_router, prefix=settings.API_V1_STR)
app.include_router(scenarios_router, prefix=settings.API_V1_STR)
app.include_router(hazard_router, prefix=settings.API_V1_STR)
app.include_router(impact_router, prefix=settings.API_V1_STR)
app.include_router(evacuation_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(preplan_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(intelligence_router, prefix=settings.API_V1_STR)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

@app.get("/")
def root_info():
    return {
        "message": "SIH 1505 Industrial Hazard Command Center API is running.",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
