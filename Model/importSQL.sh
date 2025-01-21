#!/bin/bash

# Set the PostgreSQL user password (you may also use .pgpass for better security)
export PGPASSWORD="postgres"

# PostgreSQL binaries directory (optional, adjust if binaries are not in PATH)
PG_BIN_PATH="/usr/bin"

DB_NAME="inspections"

# SQL files
STRUCTURE_FILE="drawSQL.sql"
DATA_FILE="InsertData.sql"

$PG_BIN_PATH/psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# Drop the database if it exists
$PG_BIN_PATH/psql -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

# Recreate the database
$PG_BIN_PATH/psql -U postgres -c "CREATE DATABASE $DB_NAME;"

# Import the database structure
if [ -f "$STRUCTURE_FILE" ]; then
    $PG_BIN_PATH/psql -U postgres -d $DB_NAME -f "$STRUCTURE_FILE"
else
    echo "Structure file $STRUCTURE_FILE not found."
    exit 1
fi

# Import the data
if [ -f "$DATA_FILE" ]; then
    $PG_BIN_PATH/psql -U postgres -d $DB_NAME -f "$DATA_FILE"
else
    echo "Data file $DATA_FILE not found."
    exit 1
fi

unset PGPASSWORD

echo "Database setup complete."
