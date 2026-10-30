# Server database Compose templates

Use these only when the user chose a **server database** (SQLite needs no
container). Copy the matching file into the project at the chosen DB-scripts
location (e.g. `database/compose.yaml` or the repo root) and confirm the image
tag on Docker Hub before running. Credentials are read from the project's `.env`
and must **never** be committed — commit the keys (empty) in `.env.example`.

Start one with: `docker compose -f <file> up -d`.

## `.env` keys and connection strings

**PostgreSQL** (`postgres.yaml`)
```
POSTGRES_USER=app
POSTGRES_PASSWORD=
POSTGRES_DB=app
POSTGRES_PORT=5432
DATABASE_URL=postgresql://app:${POSTGRES_PASSWORD}@localhost:5432/app
```

**MySQL** (`mysql.yaml`)
```
MYSQL_ROOT_PASSWORD=
MYSQL_DATABASE=app
MYSQL_USER=app
MYSQL_PASSWORD=
MYSQL_PORT=3306
DATABASE_URL=mysql://app:${MYSQL_PASSWORD}@localhost:3306/app
```

**SQL Server** (`sqlserver.yaml`)
```
MSSQL_SA_PASSWORD=        # must meet complexity rules (upper/lower/digit/symbol, 8+)
MSSQL_PORT=1433
MSSQL_PID=Developer
# .NET: Server=localhost,1433;Database=app;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True
```

**MongoDB** (`mongo.yaml`)
```
MONGO_USER=app
MONGO_PASSWORD=
MONGO_DB=app
MONGO_PORT=27017
MONGO_URL=mongodb://app:${MONGO_PASSWORD}@localhost:27017/app?authSource=admin
```

Add the matching keys to `.env.example` (empty values) so collaborators know
what to fill in.
