import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Decode token to get evaluator info
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const evaluatorId = decoded.evaluatorId

    const { vendorId, evaluationData } = req.body

    if (!vendorId || !evaluationData) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Check if there's already a submitted evaluation
    const submittedEvaluation = await prisma.evaluation.findFirst({
      where: {
        vendorId: Number(vendorId),
        evaluatorId: evaluatorId,
        submitted: true
      }
    })

    if (submittedEvaluation) {
      return res.status(400).json({ error: 'Cannot modify submitted evaluation' })
    }

    // Check if draft already exists
    const existingDraft = await prisma.evaluationDraft.findFirst({
      where: {
        vendorId: Number(vendorId),
        evaluatorId: evaluatorId,
      },
    })

    if (existingDraft) {
      // Update existing draft
      const updatedDraft = await prisma.evaluationDraft.update({
        where: {
          id: existingDraft.id,
        },
        data: {
          data: evaluationData,
          updatedAt: new Date(),
        },
      })
      return res.status(200).json(updatedDraft)
    } else {
      // Create new draft
      const newDraft = await prisma.evaluationDraft.create({
        data: {
          vendorId: Number(vendorId),
          evaluatorId: evaluatorId,
          data: evaluationData,
        },
      })
      return res.status(201).json(newDraft)
    }
  } catch (error) {
    console.error('Error in autosave:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}