import { ConnectionPool, config as SqlConfig } from 'mssql';

const sqlConfig: SqlConfig = {
  user: process.env.DB_USER!,
  password: process.env.DB_PASS!,
  server: process.env.DB_HOST!,
  database: process.env.DB_NAME!,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

export const getConnection = () => new ConnectionPool(sqlConfig).connect();
