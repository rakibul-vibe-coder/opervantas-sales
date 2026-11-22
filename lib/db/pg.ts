import { PGlite } from '@electric-sql/pglite'
import { Pool } from 'pg'
import path from 'path'
import fs from 'fs'

const globalForDb = globalThis as unknown as {
  pgInstance?: any
}

export interface DbClient {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>
}

export function getDb(): DbClient {
  if (!globalForDb.pgInstance) {
    const databaseUrl = process.env.DATABASE_URL

    if (databaseUrl) {
      const pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
      })
      globalForDb.pgInstance = pool
    } else {
      const dbPath = path.join(process.cwd(), '.pgdata')
      const pidFile = path.join(dbPath, 'postmaster.pid')
      try {
        if (fs.existsSync(pidFile)) {
          fs.unlinkSync(pidFile)
        }
      } catch {
        // Ignore if cannot unlink
      }
      globalForDb.pgInstance = new PGlite(dbPath)
    }
  }
  return globalForDb.pgInstance
}
