import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verify(token, process.env.JWT_SECRET || '') as { role: string; email: string; id: number };
    if (!(decoded?.role === 'ADMIN' || decoded?.email === 'admin@admin.com')) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const userId = parseInt(req.query.id as string);

    // Prevent admin from deleting themselves
    if (decoded.id === userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Delete the user
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}