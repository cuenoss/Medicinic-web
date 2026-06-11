from fastapi import APIRouter, Depends
from app.modules.auth.service import get_current_doctor, get_current_admin

# Import all module routers
from app.modules.auth.router import router as auth_router
from app.modules.patients.router import router as patients_router
from app.modules.appointments.router import router as appointments_router
from app.modules.consultations.router import router as consultations_router
from app.modules.ordonnances.router import router as ordonnances_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.finance.router import router as finance_router
from app.modules.settings.router import router as settings_router
from app.modules.admin.router import router as admin_router

api_router = APIRouter()

# Auth routes — public (no token required)
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])

# All other routes — protected (valid JWT token required)
protected = {"dependencies": [Depends(get_current_doctor)]}
api_router.include_router(patients_router, prefix="/patients", tags=["patients"], **protected)
api_router.include_router(appointments_router, prefix="/appointments", tags=["appointments"], **protected)
api_router.include_router(consultations_router, prefix="/consultations", tags=["consultations"], **protected)
api_router.include_router(ordonnances_router, prefix="/ordonnances", tags=["ordonnances"], **protected)
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"], **protected)
api_router.include_router(finance_router, prefix="/finance", tags=["finance"], **protected)
api_router.include_router(settings_router, prefix="/settings", tags=["settings"], **protected)

# Admin routes — require a valid token AND an admin email (ADMIN_EMAILS)
api_router.include_router(
    admin_router, prefix="/admin", tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is working"}