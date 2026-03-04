# Authentication System Guide

The SMB CRM now has a complete authentication system using **Argon2** password hashing and **JWT** tokens.

## Quick Start

### 1. Register a New Account

```bash
curl -X POST http://localhost:8787/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "MyS3cur3P@ssw0rd",
    "tenantName": "My Company",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_1234567890abc",
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin"
    },
    "tenant": {
      "id": "tenant_1234567890abc",
      "name": "My Company",
      "slug": "my-company",
      "plan": "free"
    }
  }
}
```

### 2. Login to Existing Account

```bash
curl -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "MyS3cur3P@ssw0rd"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {...},
    "tenant": {...}
  }
}
```

### 3. Use Access Token for Authenticated Requests

Store the `accessToken` and use it in all subsequent requests:

```bash
curl http://localhost:8787/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Refresh Access Token When Expired

When access token expires (24 hours by default):

```bash
curl -X POST http://localhost:8787/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

Returns new `accessToken` (refresh token stays the same).

---

## API Endpoints

### Public Endpoints (No Auth Required)

#### `POST /api/v1/auth/register`
Create a new account and tenant.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "tenantName": "Company Name",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Errors:**
- 400: Invalid input or weak password
- 409: Email already registered

---

#### `POST /api/v1/auth/login`
Authenticate and get tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Errors:**
- 400: Missing email or password
- 401: Invalid credentials

---

#### `POST /api/v1/auth/refresh`
Get new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- 400: Missing refresh token
- 401: Invalid/expired token

---

#### `POST /api/v1/auth/logout`
Logout (client-side token deletion recommended).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Protected Endpoints (Auth Required)

#### `GET /api/v1/auth/me`
Get current user info.

**Header:**
```
Authorization: Bearer ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin"
    },
    "tenant": {
      "id": "tenant_...",
      "name": "Company",
      "slug": "company",
      "plan": "free"
    }
  }
}
```

**Errors:**
- 401: Missing or invalid token
- 404: User not found

---

## Frontend Integration

### Create Auth Service

`packages/frontend/src/services/authService.ts`:

```typescript
import type { User, Tenant } from '../../../workers/src/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  tenant: Tenant;
}

export const authService = {
  async register(
    email: string,
    password: string,
    tenantName: string,
    firstName?: string,
    lastName?: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        tenantName,
        firstName,
        lastName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return (await response.json()).data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return (await response.json()).data;
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return (await response.json()).data;
  },

  async getCurrentUser(accessToken: string): Promise<{ user: User; tenant: Tenant }> {
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    return (await response.json()).data;
  },

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
```

### Create Auth Context

`packages/frontend/src/context/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User, Tenant } from '../../../workers/src/types';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string, password: string, tenantName: string, firstName?: string, lastName?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      authService
        .getCurrentUser(token)
        .then((data) => {
          setUser(data.user);
          setTenant(data.tenant);
        })
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const register = async (
    email: string,
    password: string,
    tenantName: string,
    firstName?: string,
    lastName?: string
  ) => {
    try {
      setError(null);
      const data = await authService.register(email, password, tenantName, firstName, lastName);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      setTenant(data.tenant);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const data = await authService.login(email, password);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setUser(data.user);
      setTenant(data.tenant);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, isAuthenticated: !!user, isLoading, register, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Use in Components

`packages/frontend/src/pages/LoginPage.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error is set in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      {error && <div className="error">{error}</div>}
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Token Storage Best Practices

### Secure Storage (Recommended)

```typescript
// Store in memory (lost on page refresh)
// Good: Prevents access to tokens via DevTools
let accessToken: string;

// Or use HttpOnly cookies (requires server configuration)
// Most secure option
```

### LocalStorage (Current Simple Implementation)

```typescript
// Current implementation - good for development
localStorage.setItem('accessToken', token);
localStorage.setItem('refreshToken', token);
```

**Note:** For production, use HttpOnly cookies or in-memory storage with refresh token rotation.

---

## Security Features

✅ **Argon2 Password Hashing** - Memory-hard, resistant to GPU attacks
✅ **JWT Tokens** - Stateless, cryptographically signed
✅ **Token Expiry** - Access token expires in 24 hours
✅ **Refresh Tokens** - 7-day refresh token for extending sessions
✅ **Password Validation** - Enforce strong passwords
✅ **Email Validation** - Prevent invalid emails
✅ **Tenant Isolation** - User only sees their own tenant data
✅ **Role-Based Access** - Different permission levels

---

## Environment Variables Required

In `.env.local` (copy from `.env.example`):

```env
JWT_SECRET=your-random-32-character-string
JWT_EXPIRY=86400
JWT_REFRESH_EXPIRY=604800
```

**Generate JWT_SECRET:**

Mac/Linux:
```bash
openssl rand -hex 32
```

Windows PowerShell:
```powershell
[System.Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

---

## Testing Authentication

### Register & Get Tokens
```bash
curl -X POST http://localhost:8787/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "tenantName": "Test Company"
  }' | jq '.data.accessToken' -r
```

### Use Token in Requests
```bash
TOKEN=$(curl ... | jq -r '.data.accessToken')

curl http://localhost:8787/api/v1/contacts \
  -H "Authorization: Bearer $TOKEN"
```

---

## Troubleshooting

### "Password does not meet requirements"
Password must have: 8+ chars, uppercase, lowercase, number, special char

### "Email already registered"
That email is already in use. Use login instead or registration with different email.

### "Not authenticated" when accessing contacts
You need to:
1. Register or login to get access token
2. Include `Authorization: Bearer TOKEN` header

### Token expired after 24 hours
This is normal. Use refresh token to get new access token:
```bash
curl -X POST http://localhost:8787/api/v1/auth/refresh \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN_HERE"}'
```

---

## Next Steps

1. ✅ Authentication system implemented and working
2. Create login/register React components
3. Protect frontend routes with authentication
4. Add more user management features (change password, reset password)
5. Implement team member invitations
6. Add OAuth/SSO options (Google, GitHub, etc.)
