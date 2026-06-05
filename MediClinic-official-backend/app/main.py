from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import text
import os

from app.db import engine, Base
from app.api.api import api_router
from app.modules.patients.models import Patient
from app.modules.appointments.models import Appointment
from app.modules.consultations.models import Consultation
from app.modules.ordonnances.models import Ordonnance

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        # Check and add amount_paid column if it doesn't exist
        async with engine.begin() as conn:
            from sqlalchemy import text
            try:
                # Check if patients.amount_paid column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'patients' AND column_name = 'amount_paid'
                """))
                
                if not result.fetchone():
                    print("Adding amount_paid column to patients table...")
                    await conn.execute(text("""
                        ALTER TABLE patients 
                        ADD COLUMN amount_paid INTEGER
                    """))
                    print("Successfully added amount_paid column")
                else:
                    print("amount_paid column already exists")
                    
            except Exception as e:
                print(f"Error checking/adding amount_paid column: {e}")

        # Check and add date column to appointments table if it doesn't exist
        async with engine.begin() as conn:
            try:
                # Check if appointments.date column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' AND column_name = 'date'
                """))
                
                if not result.fetchone():
                    print("Adding date column to appointments table...")
                    await conn.execute(text("""
                        ALTER TABLE appointments 
                        ADD COLUMN date DATE NOT NULL DEFAULT CURRENT_DATE
                    """))
                    print("Successfully added date column to appointments table")
                else:
                    print("date column already exists in appointments table")
                    
            except Exception as e:
                print(f"Error checking/adding date column: {e}")

        # Check and add created_at and updated_at columns to ordonnances table if they don't exist
        async with engine.begin() as conn:
            try:
                # Check if ordonnances.created_at column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'ordonnances' AND column_name = 'created_at'
                """))
                
                if not result.fetchone():
                    print("Adding created_at column to ordonnances table...")
                    await conn.execute(text("""
                        ALTER TABLE ordonnances 
                        ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    """))
                    print("Successfully added created_at column")
                else:
                    print("created_at column already exists in ordonnances table")
                    
            except Exception as e:
                print(f"Error checking/adding created_at column: {e}")

        async with engine.begin() as conn:
            try:
                # Check if ordonnances.updated_at column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'ordonnances' AND column_name = 'updated_at'
                """))
                
                if not result.fetchone():
                    print("Adding updated_at column to ordonnances table...")
                    await conn.execute(text("""
                        ALTER TABLE ordonnances 
                        ADD COLUMN updated_at TIMESTAMP
                    """))
                    print("Successfully added updated_at column")
                else:
                    print("updated_at column already exists in ordonnances table")
                    
            except Exception as e:
                print(f"Error checking/adding updated_at column: {e}")

        # Check and add payment fields to appointments table if they don't exist
        async with engine.begin() as conn:
            try:
                # Check if appointments.payment_amount column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' AND column_name = 'payment_amount'
                """))
                
                if not result.fetchone():
                    print("Adding payment_amount column to appointments table...")
                    await conn.execute(text("""
                        ALTER TABLE appointments 
                        ADD COLUMN payment_amount INTEGER
                    """))
                    print("Successfully added payment_amount column")
                else:
                    print("payment_amount column already exists in appointments table")
                    
            except Exception as e:
                print(f"Error checking/adding payment_amount column: {e}")

        async with engine.begin() as conn:
            try:
                # Check if appointments.payment_status column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' AND column_name = 'payment_status'
                """))
                
                if not result.fetchone():
                    print("Adding payment_status column to appointments table...")
                    await conn.execute(text("""
                        ALTER TABLE appointments 
                        ADD COLUMN payment_status VARCHAR DEFAULT 'pending'
                    """))
                    print("Successfully added payment_status column")
                else:
                    print("payment_status column already exists in appointments table")
                    
            except Exception as e:
                print(f"Error checking/adding payment_status column: {e}")

        async with engine.begin() as conn:
            try:
                # Check if appointments.payment_method column exists
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' AND column_name = 'payment_method'
                """))
                
                if not result.fetchone():
                    print("Adding payment_method column to appointments table...")
                    await conn.execute(text("""
                        ALTER TABLE appointments 
                        ADD COLUMN payment_method VARCHAR
                    """))
                    print("Successfully added payment_method column")
                else:
                    print("payment_method column already exists in appointments table")
                    
            except Exception as e:
                print(f"Error checking/adding payment_method column: {e}")
        
        # Multi-tenancy: add doctor_id to data tables and backfill legacy rows
        async with engine.begin() as conn:
            try:
                # The first registered doctor inherits all pre-existing ("legacy") data
                first_doctor_result = await conn.execute(text("SELECT MIN(id) FROM doctors"))
                first_doctor_id = first_doctor_result.scalar()

                for table_name in ["patients", "appointments", "consultations", "ordonnances", "expenses"]:
                    col_check = await conn.execute(text(f"""
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = '{table_name}' AND column_name = 'doctor_id'
                    """))

                    if not col_check.fetchone():
                        print(f"Adding doctor_id column to {table_name} table...")
                        await conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN doctor_id INTEGER"))

                        # Give every existing row to the first doctor so current data isn't lost
                        if first_doctor_id is not None:
                            await conn.execute(
                                text(f"UPDATE {table_name} SET doctor_id = :doc WHERE doctor_id IS NULL"),
                                {"doc": first_doctor_id},
                            )
                        print(f"Successfully added doctor_id to {table_name} (legacy rows -> doctor {first_doctor_id})")
                    else:
                        print(f"doctor_id column already exists in {table_name} table")
            except Exception as e:
                print(f"Error checking/adding doctor_id columns: {e}")

        print("Database tables ensured (create_all)")
    except Exception as e:
        print(f"Database connection failed: {e}")
        print("API will start, but endpoints that use the database will fail until PostgreSQL is available.")

    yield

    try:
        await engine.dispose()
        print("Database connection closed")
    except Exception as e:
        print(f"Error closing database: {e}")


app = FastAPI(
    title="MediClinic API",
    description="A comprehensive clinic management system",
    version="1.0.0",
    lifespan=lifespan,
    servers=[{"url": "http://127.0.0.1:8000", "description": "Local development server"}]
)

# Typical Vite port 5173; credentials + wildcard origin is invalid in browsers — list dev origins explicitly.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",")
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "file://",
    "app://",
    "https://mediclinic-frontend.onrender.com",
    "https://mediclinic-backend-gps2.onrender.com",
]
all_origins = list(set(DEFAULT_ORIGINS + [o.strip() for o in ALLOWED_ORIGINS if o.strip()]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

# Create uploads directory if it doesn't exist
uploads_dir = "uploads"
os.makedirs(os.path.join(uploads_dir, "patients"), exist_ok=True)

# Mount static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Temporary fix for consultations table
@app.get("/fix-consultations")
async def fix_consultations_table():
    """Create the correct consultations table"""
    try:
        async with engine.begin() as conn:
            # Drop old table if exists
            await conn.execute(text("DROP TABLE IF EXISTS consultations CASCADE"))
            
            # Create new table
            await conn.execute(text("""
                CREATE TABLE consultations (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
                    
                    -- Basic Personal Information
                    name VARCHAR(255) NOT NULL,
                    age VARCHAR(50) NOT NULL,
                    sex VARCHAR(50),
                    weight VARCHAR(50),
                    height VARCHAR(50),
                    contact VARCHAR(255),
                    
                    -- Main Complaint
                    complaint TEXT NOT NULL,
                    
                    -- History of the problem
                    when_started VARCHAR(255),
                    how_often VARCHAR(255),
                    getting_better VARCHAR(255),
                    triggers VARCHAR(255),
                    makes_better VARCHAR(255),
                    
                    -- Current Medications
                    medications TEXT,
                    
                    -- Symptoms Checklist
                    fever BOOLEAN DEFAULT FALSE,
                    pain BOOLEAN DEFAULT FALSE,
                    nausea BOOLEAN DEFAULT FALSE,
                    cough BOOLEAN DEFAULT FALSE,
                    dizziness BOOLEAN DEFAULT FALSE,
                    fatigue BOOLEAN DEFAULT FALSE,
                    
                    -- Medical History
                    allergies TEXT,
                    chronic_conditions TEXT,
                    surgeries TEXT,
                    
                    -- Family Medical History
                    family_history TEXT,
                    
                    -- Consultation Details
                    diagnosis TEXT,
                    date TIMESTAMP NOT NULL,
                    doctor VARCHAR(255) NOT NULL,
                    
                    -- Timestamps
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE
                );
            """))
            
            # Create indexes
            await conn.execute(text("""
                CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
                CREATE INDEX idx_consultations_date ON consultations(date);
                CREATE INDEX idx_consultations_doctor ON consultations(doctor);
            """))
            
        return {"message": "Consultations table fixed successfully!"}
        
    except Exception as e:
        return {"error": f"Failed to fix consultations table: {str(e)}"}

@app.get("/")
async def root():
    return {
        "message": "MediClinic backend is running",
        "api_prefix": "/api",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }

