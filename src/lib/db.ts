import {
  createPool,
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

const globalForDb = globalThis as unknown as { dbPool?: Pool };

export type DbParam = string | number | boolean | null | Date | Buffer;

function createDbPool(): Pool {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_CONNECTION_LIMIT,
  } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error(
      "Faltan variables de entorno para la base de datos (DB_HOST, DB_USER, DB_NAME). Revisa el archivo .env",
    );
  }

  // max_user_connections en el servidor MySQL es 5.
  // Usamos por defecto 2 conexiones en el pool (máximo 3 si se define por variable).
  // Esto garantiza que el pool nunca sobrepase el límite del usuario y deja
  // conexiones libres para herramientas de administración y recargas.
  const parsedLimit = Number(DB_CONNECTION_LIMIT ?? 2);
  const connectionLimit = Math.max(1, Math.min(parsedLimit, 3));

  return createPool({
    host: DB_HOST,
    port: Number(DB_PORT ?? 3306),
    user: DB_USER,
    password: DB_PASSWORD ?? "",
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit,
    queueLimit: 0,
    maxIdle: connectionLimit,
    idleTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    dateStrings: true,
  });
}

// Mantener siempre una única instancia de pool en el proceso (incluyendo producción)
export const dbPool: Pool =
  globalForDb.dbPool ?? (globalForDb.dbPool = createDbPool());

export async function dbQuery<T>(
  sql: string,
  params: DbParam[] = [],
): Promise<T[]> {
  const [rows] = await dbPool.execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function dbExecute(
  sql: string,
  params: DbParam[] = [],
): Promise<ResultSetHeader> {
  const [result] = await dbPool.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function withConnection<T>(
  callback: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await dbPool.getConnection();
  try {
    return await callback(connection);
  } finally {
    connection.release();
  }
}

export async function dbTransaction<T>(
  callback: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
