import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { UserRole } from '@/types/auth';

export interface DecodedToken {
  id: string;
  email: string;
  role: UserRole;
}

export function verifyAuth(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');

  if (!authToken?.value) {
    throw new Error('Authentication required');
  }

  try {
    const decoded = jwt.verify(authToken.value, process.env.NEXT_PUBLIC_JWT_SECRET_KEY!) as DecodedToken;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function verifyRole(decoded: DecodedToken, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(decoded.role)) {
    throw new Error('Unauthorized access');
  }
}
