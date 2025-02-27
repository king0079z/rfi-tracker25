import { NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { withAuth, AuthenticatedRequest } from '@/lib/auth'

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  if (!req.user) {
    console.error('Submit Evaluation API: Unauthorized access attempt')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    console.error(`Submit Evaluation API: Invalid method ${req.method}`)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const evaluationId = parseInt(req.query.id as string)
    const { evaluatorId } = req.user
    
    if (isNaN(evaluationId)) {
      console.error(`Submit Evaluation API: Invalid evaluation ID ${req.query.id}`)
      return res.status(400).json({ error: 'Invalid evaluation ID' })
    }

    // Verify evaluation exists and belongs to the evaluator
    const evaluation = await prisma.evaluation.findFirst({
      where: { 
        id: evaluationId,
        evaluatorId: evaluatorId
      }
    })

    if (!evaluation) {
      console.error(`Submit Evaluation API: Evaluation not found or unauthorized ID=${evaluationId}`)
      return res.status(404).json({ error: 'Evaluation not found or unauthorized' })
    }

    if (evaluation.submitted) {
      console.error(`Submit Evaluation API: Evaluation already submitted ID=${evaluationId}`)
      return res.status(400).json({ error: 'Evaluation already submitted' })
    }

    // Update evaluation to submitted state
    const updatedEvaluation = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { 
        submitted: true,
        status: 'COMPLETED'
      }
    })

    // Delete any existing draft
    await prisma.evaluationDraft.deleteMany({
      where: {
        vendorId: evaluation.vendorId,
        evaluatorId: evaluatorId
      }
    })

    return res.status(200).json(updatedEvaluation)
  } catch (error: any) {
    console.error('Error submitting evaluation:', error)
    return res.status(500).json({ 
      error: 'Failed to submit evaluation',
      details: process.env.NODE_ENV === 'development' ? error.message || 'Unknown error' : undefined
    })
  }
}

export default withAuth(handler)