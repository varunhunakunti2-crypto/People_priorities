# Peoples Priorities AI (peoples-priorities-ai)

A hackathon project designed to analyze and cluster citizens' priorities using NLP and machine learning, exposing the insights via a FastAPI backend.

## Project Structure

This project follows a modular structure to separate data seeding, backend services, NLP modeling, and exports.

```text
peoples-priorities-ai/
├── data/          # CSV seed files & SQLite databases
├── backend/       # FastAPI application and routing
├── nlp/           # NLP and clustering scripts
├── scripts/       # Data generation and loading scripts
└── exports/       # Gitignored directory for PDF/Excel reports
```

### Folder Breakdown

- 📁 **[`/data`](file:///c:/Users/varun/Music/New%20folder/Projects/hackthon/peoples-priorities-ai/data)**: Contains input CSV datasets, seed files, and the local SQLite database (`*.db`). This folder stores the raw and processed data that feeds the pipeline.
- 📁 **[`/backend`](file:///c:/Users/varun/Music/New%20folder/Projects/hackthon/peoples-priorities-ai/backend)**: Houses the FastAPI application. Includes endpoints for fetching clustered priorities, serving analytics, and providing raw data for the frontend.
- 📁 **[`/nlp`](file:///c:/Users/varun/Music/New%20folder/Projects/hackthon/peoples-priorities-ai/nlp)**: Contains data preprocessing, text embedding generation, and clustering algorithms (e.g., K-Means, HDBSCAN) used to group citizen concerns.
- 📁 **[`/scripts`](file:///c:/Users/varun/Music/New%20folder/Projects/hackthon/peoples-priorities-ai/scripts)**: Helper scripts for mock data generation, database initialization, seeding, and automating model training tasks.
- 📁 **[`/exports`](file:///c:/Users/varun/Music/New%20folder/Projects/hackthon/peoples-priorities-ai/exports)**: Temporary output folder for generated PDFs, Excel files, and visualization charts. This directory is configured to be ignored by Git to avoid repository clutter.

## Setup Instructions

1. **Virtual Environment Set Up**:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Unix/macOS:
   source venv/bin/activate
   ```

2. **Backend Execution**:
   Navigate to the `/backend` folder and run the FastAPI server (e.g., using `uvicorn`).
