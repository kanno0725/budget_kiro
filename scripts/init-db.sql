-- Database initialization script
-- This file is automatically executed when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist (though it's already created by POSTGRES_DB)
-- SELECT 'CREATE DATABASE household_budget_db' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'household_budget_db');

-- Set timezone
SET timezone = 'Asia/Tokyo';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database household_budget_db initialized successfully';
END $$;