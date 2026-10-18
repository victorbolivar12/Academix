import {
  createPool,
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

const globalForDb = globalThis as unknown as { dbPool?: Pool };

export type DbParam = string | number | boolean | null | Date | Buffer;

function createDbPool(): Pool {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error(
      "Faltan variables de entorno para la base de datos (DB_HOST, DB_USER, DB_NAME). Revisa el archivo .env",
    );
  }

  return createPool({
    host: DB_HOST,
    port: Number(DB_PORT ?? 3306),
    user: DB_USER,
    password: DB_PASSWORD ?? "",
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
}

export const dbPool: Pool = globalForDb.dbPool ?? createDbPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.dbPool = dbPool;
}

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
