import oracledb from 'oracledb';
import 'dotenv/config';

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

export async function query(sql, binds = {}, options = {}) {
  const connection = await oracledb.getConnection({
    user: process.env.DB_USER || 'PHARMA',
    password: process.env.DB_PASSWORD || 'pharma_pwd',
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/FREE',
  });
  try {
    return await connection.execute(sql, binds, options);
  } finally {
    await connection.close();
  }
}

export async function withTransaction(work) {
  const connection = await oracledb.getConnection({
    user: process.env.DB_USER || 'PHARMA',
    password: process.env.DB_PASSWORD || 'pharma_pwd',
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/FREE',
  });
  try {
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.close();
  }
}
