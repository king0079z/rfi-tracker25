import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    console.error(`Method ${req.method} not allowed for pending users endpoint`);
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    // Validate authentication with detailed logging
    if (!req.user) {
      console.error('No user found in request. Headers:', JSON.stringify(req.headers, null, 2));
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized',
        details: 'No authenticated user found'
      });
    }

    // Check if user is admin with detailed logging
    if (!(req.user?.role === 'ADMIN' || req.user?.email === 'admin@admin.com')) {
      console.error(`Access denied for user: ${req.user.email} with role: ${req.user.role}`);
      return res.status(403).json({ 
        success: false,
        message: 'Forbidden',
        details: 'Admin access required'
      });
    }

    // Get pending users with error handling for database operations
    try {
      const pendingUsers = await prisma.user.findMany({
        where: {
          approvalStatus: 'PENDING'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approvalStatus: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Log successful retrieval
      console.log(`Successfully retrieved ${pendingUsers.length} pending users`);
      
      return res.status(200).json({ 
        success: true,
        users: pendingUsers,
        count: pendingUsers.length,
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.error('Database error while fetching pending users:', dbError);
      return res.status(500).json({ 
        success: false,
        message: 'Database error',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      });
    }
  } catch (error) {
    console.error('Unexpected error in pending users endpoint:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

export default withAuth(handler);