@echo off
:: Change to the directory where PostgreSQL binaries are located
cd /d "E:\Programy\PostgreSQL\bin"

:: Set the password for the PostgreSQL user
set PGPASSWORD=postgres

:: Terminate all active connections to the database
psql -U postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE datname = 'inspections' AND pid <> pg_backend_pid();"

:: Drop the database if it exists
psql -U postgres -c "DROP DATABASE IF EXISTS inspections;"

:: Recreate the database
psql -U postgres -c "CREATE DATABASE inspections;"

:: Import the structure (drawSQL.sql) from the directory where the script was run
psql -U postgres -d inspections < "%~dp0drawSQL.sql"

:: Import the data (InsertData.sql) from the directory where the script was run
psql -U postgres -d inspections < "%~dp0InsertData.sql"

:: Pause to view output
pause
