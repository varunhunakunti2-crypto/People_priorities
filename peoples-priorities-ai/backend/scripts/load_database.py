import os
import sqlite3
import pandas as pd

def main():
    # Base path of peoples-priorities-ai project
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "data")
    db_path = os.path.join(data_dir, "peoples_priorities.db")

    print(f"Connecting to/creating database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Enable foreign keys support in SQLite
    cursor.execute("PRAGMA foreign_keys = ON;")

    # ==========================================
    # 1. Create Tables with Schema
    # ==========================================
    print("Creating tables if they do not exist...")
    
    # villages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS villages (
        village_id TEXT PRIMARY KEY,
        village_name TEXT NOT NULL,
        subdistrict TEXT NOT NULL,
        population INTEGER NOT NULL,
        literacy_rate_pct REAL NOT NULL,
        sc_st_pct REAL NOT NULL,
        distance_to_town_km REAL NOT NULL,
        has_primary_school TEXT NOT NULL,
        has_secondary_school TEXT NOT NULL,
        has_health_subcentre TEXT NOT NULL,
        has_tap_water TEXT NOT NULL,
        has_paved_road TEXT NOT NULL
    );
    """)

    # schools table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS schools (
        udise_code TEXT PRIMARY KEY,
        village_id TEXT NOT NULL,
        school_category TEXT NOT NULL,
        total_enrollment INTEGER NOT NULL,
        building_capacity INTEGER NOT NULL,
        enrollment_capacity_ratio REAL NOT NULL,
        pupil_teacher_ratio INTEGER NOT NULL,
        functional_toilets INTEGER NOT NULL,
        FOREIGN KEY (village_id) REFERENCES villages (village_id)
    );
    """)

    # existing_works table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS existing_works (
        work_id TEXT PRIMARY KEY,
        village_id TEXT NOT NULL,
        source TEXT NOT NULL,
        work_type TEXT NOT NULL,
        amount_lakh_inr REAL NOT NULL,
        status TEXT NOT NULL,
        year INTEGER NOT NULL,
        FOREIGN KEY (village_id) REFERENCES villages (village_id)
    );
    """)

    # submissions table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        submission_id TEXT PRIMARY KEY,
        village_id TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        channel TEXT NOT NULL,
        language_detected TEXT NOT NULL,
        submitted_on TEXT NOT NULL,
        status TEXT NOT NULL,
        FOREIGN KEY (village_id) REFERENCES villages (village_id)
    );
    """)

    # themes table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS themes (
        theme_id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme_label TEXT NOT NULL UNIQUE,
        keyword_summary TEXT
    );
    """)

    # submission_themes join table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submission_themes (
        submission_id TEXT NOT NULL,
        theme_id INTEGER NOT NULL,
        confidence_score REAL NOT NULL,
        PRIMARY KEY (submission_id, theme_id),
        FOREIGN KEY (submission_id) REFERENCES submissions (submission_id),
        FOREIGN KEY (theme_id) REFERENCES themes (theme_id)
    );
    """)

    # users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    print("Schema creation complete.")

    # ==========================================
    # 2. Load CSV Data using pandas
    # ==========================================
    csv_to_table = {
        "villages.csv": "villages",
        "schools.csv": "schools",
        "existing_works.csv": "existing_works",
        "submissions.csv": "submissions"
    }

    # Clear existing data in reverse order of foreign key dependencies to avoid constraints violation
    print("Clearing existing data...")
    cursor.execute("DELETE FROM submission_themes;")
    cursor.execute("DELETE FROM submissions;")
    cursor.execute("DELETE FROM schools;")
    cursor.execute("DELETE FROM existing_works;")
    cursor.execute("DELETE FROM villages;")
    conn.commit()

    for csv_file, table_name in csv_to_table.items():
        csv_path = os.path.join(data_dir, csv_file)
        if not os.path.exists(csv_path):
            print(f"Error: {csv_file} not found. Please run generate_seed_data.py first.")
            conn.close()
            return
        
        print(f"Loading {csv_file} into '{table_name}' table...")
        df = pd.read_csv(csv_path)
        
        # Append data to the table
        df.to_sql(table_name, conn, if_exists="append", index=False)

    print("Data loading complete.")

    # ==========================================
    # 3. Print Row Counts
    # ==========================================
    tables = ["villages", "schools", "existing_works", "submissions", "themes", "submission_themes"]
    print("\n--- Current Table Row Counts ---")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table};")
        count = cursor.fetchone()[0]
        print(f"Table '{table}': {count} rows")

    conn.close()
    print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()
