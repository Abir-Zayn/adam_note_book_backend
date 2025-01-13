import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'

//Creates a new PostgreSQL connection pool with the specified connection string.
const pool = new Pool(
    {
        connectionString: "postgresql://postgres:test123@db:5432/mydb",
        ssl: false
    }
);

export const db = drizzle(pool);