import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối SQL Server - SQL Server Authentication
// Dùng port trực tiếp thay vì tên instance để không cần SQL Browser
const dbConfig: sql.config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433'),
  database: process.env.DB_NAME || 'DaNangGo',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 15000,
};

// Pool kết nối dùng chung toàn app
let pool: sql.ConnectionPool | null = null;

/**
 * Khởi tạo và trả về pool kết nối database.
 * Gọi hàm này 1 lần khi server khởi động.
 */
export async function connectDB(): Promise<sql.ConnectionPool> {
  if (pool) return pool;

  try {
    pool = await sql.connect(dbConfig);
    console.log(`✅ Kết nối SQL Server thành công: ${process.env.DB_SERVER}:${process.env.DB_PORT} / ${process.env.DB_NAME}`);
    return pool;
  } catch (error) {
    console.error('❌ Kết nối SQL Server thất bại:', error);
    throw error;
  }
}

/**
 * Lấy pool hiện tại (dùng trong các module/service).
 * Đảm bảo đã gọi connectDB() trước.
 */
export function getPool(): sql.ConnectionPool {
  if (!pool) {
    throw new Error('Database chưa được kết nối! Hãy gọi connectDB() trước.');
  }
  return pool;
}

/**
 * Đóng kết nối database (dùng khi tắt server).
 */
export async function closeDB(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 Đã đóng kết nối SQL Server.');
  }
}

export { sql };
