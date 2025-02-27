import { NextApiRequest, NextApiResponse } from 'next';
import { verify } from 'jsonwebtoken';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: number;
    email: string;
    role: string;
    evaluatorId?: number;
    name?: string;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Check JWT secret
      if (!process.env.JWT_SECRET) {
        console.error('Critical: JWT_SECRET is not configured in environment variables');
        return res.status(500).json({ 
          error: 'Server configuration error',
          details: 'Authentication system is not properly configured'
        });
      }

      // Try to get token from different sources
      let token: string | undefined;
      let tokenSource: string = 'none';

      // 1. Check Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        tokenSource = 'header';
      }

      // 2. Check cookies if no token in header
      if (!token && req.cookies.token) {
        token = req.cookies.token;
        tokenSource = 'cookie';
      }

      if (!token) {
        console.error('Authentication failed: No token found. Headers:', JSON.stringify({
          authorization: req.headers.authorization,
          cookie: req.headers.cookie
        }, null, 2));
        return res.status(401).json({ 
          error: 'Authentication required',
          details: 'No valid authentication token found'
        });
      }

      try {
        console.log(`Attempting to verify token from ${tokenSource}`);
        const decoded = verify(token, process.env.JWT_SECRET) as any;
        
        // Validate token payload
        if (!decoded.userId || !decoded.email || !decoded.role) {
          console.error('Invalid token payload:', JSON.stringify(decoded, null, 2));
          return res.status(401).json({ 
            error: 'Invalid token',
            details: 'Token payload is missing required fields'
          });
        }

        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          console.error(`Token expired at ${new Date(decoded.exp * 1000).toISOString()}`);
          return res.status(401).json({ 
            error: 'Token expired',
            details: 'Please log in again'
          });
        }

        // Set user information in request
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          evaluatorId: decoded.evaluatorId,
          name: decoded.name,
        };

        console.log(`Successfully authenticated user: ${decoded.email}`);
        return handler(req, res);
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError);
        return res.status(401).json({ 
          error: 'Invalid token',
          details: verifyError instanceof Error ? verifyError.message : 'Token verification failed'
        });
      }
    } catch (error) {
      console.error('Unexpected authentication error:', error);
      return res.status(500).json({ 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unexpected error during authentication'
      });
    }
  };
}