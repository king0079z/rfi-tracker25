import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Update all existing users without an approval status to APPROVED
    const updatedUsers = await prisma.user.updateMany({
      where: {
        OR: [
          { approvalStatus: null },
          { approvalStatus: undefined },
          { approvalStatus: 'PENDING' }
        ],
        createdAt: {
          // Only update users created before today
          lt: new Date()
        }
      },
      data: {
        approvalStatus: 'APPROVED'
      }
    });

    return res.status(200).json({
      message: `Successfully updated ${updatedUsers.count} users to APPROVED status`,
      updatedCount: updatedUsers.count
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}