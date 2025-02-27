import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status } = req.body;

    if (!id || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET) as { role: string; email: string };
      if (!(decoded?.role === 'ADMIN' || decoded?.email === 'admin@admin.com')) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Update user approval status
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        approvalStatus: status as 'APPROVED' | 'REJECTED',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      }
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error in user approval:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}