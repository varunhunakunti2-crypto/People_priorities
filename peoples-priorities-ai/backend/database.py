import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

# The default DATABASE_URL will be the Supabase Postgres string
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:SXLMyQTjlU7GS55M@db.mezuyxethltywedukjrd.supabase.co:5432/postgres"
)

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    except psycopg2.OperationalError as e:
        print(f"DB Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect to the database."
        )

def get_cursor(conn):
    return conn.cursor(cursor_factory=RealDictCursor)
