import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  email: string;
  userType: string;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as TokenPayload;
    return decoded;
  } catch (error) {
    // Token verification error handled silently
    return null;
  }
} 