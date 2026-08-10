import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base

load_dotenv()

# Use DATABASE_URL env var in production, fallback to local for development
_db_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:iyad1212@localhost:5432/mediclinic")
# Render provides postgresql:// — switch to asyncpg driver for local async DB access
DATABASE_URL = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()



async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


#create all tables
async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)