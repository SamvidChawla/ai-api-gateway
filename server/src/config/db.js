import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
host: "localhost",
port: 5432,
user: "postgres",
password: process.env.PGPASSWORD,
database: "ai_api_gateway",
});

export const connectDB = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (err) {
    console.error("PostgreSQL connection failed");
    console.error(err.message);
    process.exit(1);
  }
};

export default pool;


