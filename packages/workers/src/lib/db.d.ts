export declare class Database {
  private db;
  constructor(db: D1Database);
  query(sql: string, params?: any[], tenantId?: string): Promise<any>;
  getOne(sql: string, params?: any[]): Promise<any | null>;
  getAll(sql: string, params?: any[]): Promise<any[]>;
  execute(
    sql: string,
    params?: any[]
  ): Promise<{
    changes: number;
  }>;
  transaction<T>(callback: (db: Database) => Promise<T>): Promise<T>;
}
export declare function withTenant(sql: string, tenantId: string): [string, string];
export declare function generateId(prefix?: string): string;
export declare function now(): number;
//# sourceMappingURL=db.d.ts.map
