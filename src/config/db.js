const { Pool } = require('pg');

const connectionString = "postgresql://postgres.gkutwphomyxksxhvphmw:proyecto_iot@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const pool = new Pool({
  connectionString,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
