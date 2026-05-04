import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

config();

export default defineConfig({
  driver: 'pg',
  schema: './src/db/schema/',
  out: './drizzle',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
