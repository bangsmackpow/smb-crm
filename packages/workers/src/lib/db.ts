// Utility functions for database operations in multi-tenant environment

export class Database {
  constructor(private db: D1Database) {}

  /**
   * Execute a query with tenant_id automatically included
   */
  async query(sql: string, params: any[] = [], tenantId?: string): Promise<any> {
    try {
      const stmt = this.db.prepare(sql);
      const result = await stmt.bind(...params).all();
      return result;
    } catch (error) {
      console.error('[DB Error]', sql, error);
      throw error;
    }
  }

  /**
   * Get a single row
   */
  async getOne(sql: string, params: any[] = []): Promise<any | null> {
    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .first();
    return result || null;
  }

  /**
   * Get all rows
   */
  async getAll(sql: string, params: any[] = []): Promise<any[]> {
    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .all();
    return result.results || [];
  }

  /**
   * Execute a mutation (INSERT, UPDATE, DELETE)
   */
  async execute(sql: string, params: any[] = []): Promise<{ changes: number }> {
    const result = await this.db
      .prepare(sql)
      .bind(...params)
      .run();
    return {
      changes: result.meta.changes,
    };
  }

  /**
   * Start a transaction
   */
  async transaction<T>(callback: (db: Database) => Promise<T>): Promise<T> {
    try {
      await this.db.exec('BEGIN TRANSACTION');
      const result = await callback(this);
      await this.db.exec('COMMIT');
      return result;
    } catch (error) {
      await this.db.exec('ROLLBACK');
      throw error;
    }
  }
}

/**
 * Helper to build tenant-scoped query
 */
export function withTenant(sql: string, tenantId: string): [string, string] {
  // This adds tenant_id to WHERE clause if not already present
  const hasTenantCheck = sql.toLowerCase().includes('tenant_id');
  if (!hasTenantCheck && sql.includes('WHERE')) {
    return [sql.replace(/WHERE\s+/i, `WHERE tenant_id = ? AND `), tenantId];
  }
  return [sql, tenantId];
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Get current timestamp in seconds
 */
export function now(): number {
  return Math.floor(Date.now() / 1000);
}
