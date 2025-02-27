import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists in either user or evaluator table
    const [existingUser, existingEvaluator] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.evaluator.findUnique({ where: { email } })
    ]);

    if (existingUser || existingEvaluator) {
      return res.status(400).json({ 
        message: 'An account with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Only allow admin@admin.com to be registered as admin
    const isAdmin = email.toLowerCase() === 'admin@admin.com';
    
    // For admin@admin.com, ensure it's always approved
    if (isAdmin) {
      const existingAdmin = await prisma.user.findFirst({
        where: {
          email: 'admin@admin.com',
        }
      });
      
      if (existingAdmin) {
        return res.status(400).json({ 
          message: 'Admin account already exists' 
        });
      }
    }

    // Use transaction to ensure both user and evaluator are created or neither
    const { user, evaluator } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: isAdmin ? 'ADMIN' : 'CONTRIBUTOR',
          approvalStatus: isAdmin ? 'APPROVED' : 'PENDING',
        },
      });

      const evaluator = await tx.evaluator.create({
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: isAdmin ? 'ADMIN' : 'CONTRIBUTOR',
        },
      });

      return { user, evaluator };
    });

    // Create JWT token
    const token = sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        evaluatorId: evaluator.id,
      },
      process.env.JWT_SECRET || '',
      { expiresIn: '1d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    const successMessage = isAdmin 
      ? 'Admin account created successfully. You can now log in.'
      : 'User registered successfully. Please wait for admin approval.';

    return res.status(201).json({
      message: successMessage,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Check for specific error types
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'An account with this email already exists' 
      });
    }
    
    return res.status(500).json({ 
      message: 'An error occurred during registration. Please try again.' 
    });
  }
}