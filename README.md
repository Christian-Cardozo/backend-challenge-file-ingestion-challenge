# File Ingestion challenge

NodeJS microservice that reads a .dat file and insert each record into a SQL Server database.

## Features

- Line-by-line file processing
- Record validation
- Batch inserts to database
- HTTP Endpoint to start the process (`POST /process-file`)
- HTTP Endpoint to check service health (`GET /health`)

## Requirements

- Docker
- SQL client (e.g. DBeaver, Azure Data Studio) to inspect the database (Optional)

## Installation

1. Clone the repository:

```bash
    git clone https://github.com/Christian-Cardozo/backend-challenge-file-ingestion-challenge.git        
```

2. Create a .env file:

```env
    DB_USER=sa
    DB_PASS=TuPassword123!
    DB_HOST=sqlserver
    DB_NAME=ClientesDB
    PORT=3000
```

3. Start the service

```bash    
    cd backend-challenge-file-ingestion-challenge    
    docker compose up --build -up
```

