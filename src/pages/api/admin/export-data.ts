import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all data from the database
    const exportData = await fetchAllData();
    
    return res.status(200).json({
      message: 'Data exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Error during data export:', error);
    return res.status(500).json({ error: 'Failed to export data', details: error });
  }
}

async function fetchAllData() {
  try {
    // Fetch all vendors
    const vendors = await prisma.vendor.findMany();
    
    // Fetch all users
    const users = await prisma.user.findMany();
    
    // Fetch all evaluators
    const evaluators = await prisma.evaluator.findMany();
    
    // Fetch all evaluations
    const evaluations = await prisma.evaluation.findMany();
    
    // Fetch all comments
    const comments = await prisma.comment.findMany();
    
    // Fetch all documents
    const documents = await prisma.document.findMany();
    
    // Fetch all chat messages
    const chatMessages = await prisma.chatMessage.findMany();
    
    // Fetch all chat notifications
    const chatNotifications = await prisma.chatNotification.findMany();
    
    // Fetch all vendor votes
    const vendorVotes = await prisma.vendorVote.findMany();
    
    // Fetch admin settings
    const adminSettings = await prisma.adminSettings.findFirst({
      where: { id: 1 }
    });
    
    // Fetch all evaluation drafts
    const evaluationDrafts = await prisma.evaluationDraft.findMany();
    
    return {
      vendors,
      users,
      evaluators,
      evaluations,
      comments,
      documents,
      chatMessages,
      chatNotifications,
      vendorVotes,
      adminSettings,
      evaluationDrafts
    };
  } catch (error) {
    console.error('Error fetching data for export:', error);
    throw error;
  }
}