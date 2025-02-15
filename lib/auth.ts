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
    const decoded = jwt.verify(authToken.value, process.env.JWT_SECRET!) as DecodedToken;
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

// Example usage in API route:
/*
import { verifyAuth, verifyRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const decoded = verifyAuth(request);
    verifyRole(decoded, ['admin', 'restaurant']);
    
    // Your API logic here
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401 }
    );
  }
}
*/
