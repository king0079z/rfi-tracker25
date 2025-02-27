import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        evaluator: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Handle approval status check - skip for admin@admin.com
    if (email.toLowerCase() !== 'admin@admin.com') {
      if (!user.approvalStatus || user.approvalStatus === 'PENDING') {
        return res.status(403).json({ 
          message: 'Your account is pending approval',
          approvalStatus: 'PENDING'
        });
      }

      if (user.approvalStatus === 'REJECTED') {
        return res.status(403).json({ 
          message: 'Your registration has been rejected',
          approvalStatus: 'REJECTED'
        });
      }

      if (user.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ 
          message: 'Your account is not approved',
          approvalStatus: user.approvalStatus
        });
      }
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Create JWT token with all necessary user information
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      evaluatorId: user.evaluator?.id,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };

    const token = sign(tokenPayload, process.env.JWT_SECRET);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Set token in HTTP-only cookie as well
    res.setHeader('Set-Cookie', `token=${token}; Path=/; HttpOnly; SameSite=Strict`);

    return res.status(200).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}