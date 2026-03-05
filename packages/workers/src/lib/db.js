export class Database {
    constructor(db) {
        this.db = db;
    }
    async query(sql, params = [], tenantId) {
        try {
            const stmt = this.db.prepare(sql);
            const result = await stmt.bind(...params).all();
            return result;
        }
        catch (error) {
            console.error('[DB Error]', sql, error);
            throw error;
        }
    }
    async getOne(sql, params = []) {
        const result = await this.db.prepare(sql).bind(...params).first();
        return result || null;
    }
    async getAll(sql, params = []) {
        const result = await this.db.prepare(sql).bind(...params).all();
        return result.results || [];
    }
    async execute(sql, params = []) {
        const result = await this.db.prepare(sql).bind(...params).run();
        return {
            changes: result.meta.changes,
        };
    }
    async transaction(callback) {
        try {
            await this.db.exec('BEGIN TRANSACTION');
            const result = await callback(this);
            await this.db.exec('COMMIT');
            return result;
        }
        catch (error) {
            await this.db.exec('ROLLBACK');
            throw error;
        }
    }
}
export function withTenant(sql, tenantId) {
    const hasTenantCheck = sql.toLowerCase().includes('tenant_id');
    if (!hasTenantCheck && sql.includes('WHERE')) {
        return [sql.replace(/WHERE\s+/i, `WHERE tenant_id = ? AND `), tenantId];
    }
    return [sql, tenantId];
}
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
export function now() {
    return Math.floor(Date.now() / 1000);
}
//# sourceMappingURL=db.js.map