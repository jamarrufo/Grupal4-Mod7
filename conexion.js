const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgre',
  host: 'localhost',
  database: 'banco',
  password: '1234567',
  port: 5432,
});

module.exports = pool;