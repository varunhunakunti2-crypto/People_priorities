import os
import psycopg2
import sqlite3
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from fastapi import HTTPException, status

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:SXLMyQTjlU7GS55M@db.mezuyxethltywedukjrd.supabase.co:5432/postgres"
)

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor
        self.last_inserted_id = None

    def execute(self, query, params=None):
        # 1. Map Postgres placeholder %s to SQLite ?
        query = query.replace('%s', '?')
        
        # 2. Handle Postgres RETURNING clause
        is_returning = False
        if 'RETURNING theme_id' in query:
            query = query.replace('RETURNING theme_id', '')
            is_returning = True
            
        if params:
            # Convert list of parameters (which might be dicts or tuples)
            self.cursor.execute(query, params)
        else:
            self.cursor.execute(query)
            
        if is_returning:
            self.last_inserted_id = self.cursor.lastrowid

    def fetchone(self):
        if self.last_inserted_id is not None:
            val = self.last_inserted_id
            self.last_inserted_id = None
            return {'theme_id': val}
        return self.cursor.fetchone()

    def fetchall(self):
        return self.cursor.fetchall()

    def __getattr__(self, name):
        return getattr(self.cursor, name)

class SQLiteConnectionWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, *args, **kwargs):
        cursor = self.conn.cursor()
        cursor.row_factory = sqlite3.Row
        return SQLiteCursorWrapper(cursor)

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()

    def __getattr__(self, name):
        return getattr(self.conn, name)

def get_db_connection():
    try:
        # Avoid hanging on connection attempts to IPv6 database locally
        is_deployed = os.getenv("RENDER") or os.getenv("VERCEL")
        if "db.mezuyxethltywedukjrd.supabase.co" in DATABASE_URL and not is_deployed:
            raise psycopg2.OperationalError("Bypassing IPv6 Supabase connection locally to prevent hang.")
            
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        conn.autocommit = True
        return conn
    except Exception as e:
        is_deployed = os.getenv("RENDER") or os.getenv("VERCEL")
        if is_deployed:
            raise RuntimeError(f"Production database connection failed: {str(e)}")
        print(f"Supabase Postgres connection failed ({e}). Falling back to local SQLite...")
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sqlite_path = os.path.join(base_dir, "data", "peoples_priorities.db")
        conn = sqlite3.connect(sqlite_path)
        return SQLiteConnectionWrapper(conn)

def get_cursor(conn):
    if isinstance(conn, SQLiteConnectionWrapper):
        return conn.cursor()
    return conn.cursor(cursor_factory=RealDictCursor)

