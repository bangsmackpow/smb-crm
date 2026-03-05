export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  type?: string;
  iat?: number;
  exp?: number;
}
export declare function generateAccessToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  env?: any
): Promise<string>;
export declare function generateRefreshToken(
  userId: string,
  tenantId: string,
  env?: any
): Promise<string>;
export declare function verifyToken(token: string, env?: any): Promise<JWTPayload | null>;
export declare function extractToken(authHeader: string | null | undefined): string | null;
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
export declare function isValidPassword(password: string): {
  valid: boolean;
  errors: string[];
};
export declare function isValidEmail(email: string): boolean;
//# sourceMappingURL=auth.d.ts.map
