import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

export async function deployDatabase() {
  try {
    // Run database migrations
    console.log('Running database migrations...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    
    // Verify database connection
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('Database connection verified successfully')
    
    // Create default admin settings if they don't exist
    await prisma.adminSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        chatEnabled: true,
        directDecisionEnabled: true,
        printEnabled: true,
        exportEnabled: true
      }
    })
    
    await prisma.$disconnect()
    console.log('Database deployment completed successfully')
    return true
  } catch (error) {
    console.error('Database deployment failed:', error)
    throw error
  }
}

// Function to verify database connection
export async function verifyDatabaseConnection() {
  const prisma = new PrismaClient()
  try {
    // Try a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`
    console.log('Database connection verified successfully')
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  } finally {
    await prisma.$disconnect()
  }
}

// Function to migrate data between databases
export async function migrateData(sourceData: any) {
  const prisma = new PrismaClient()
  
  try {
    console.log('Starting data migration process...')
    
    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const migrationResults: Record<string, { success: number; failed: number }> = {}
      
      // Migrate vendors
      if (sourceData.vendors && Array.isArray(sourceData.vendors)) {
        migrationResults.vendors = { success: 0, failed: 0 }
        for (const vendor of sourceData.vendors) {
          try {
            await tx.vendor.upsert({
              where: { id: vendor.id },
              update: vendor,
              create: vendor,
            })
            migrationResults.vendors.success++
          } catch (error) {
            console.error(`Failed to migrate vendor ${vendor.id}:`, error)
            migrationResults.vendors.failed++
          }
        }
      }
      
      // Migrate evaluators
      if (sourceData.evaluators && Array.isArray(sourceData.evaluators)) {
        migrationResults.evaluators = { success: 0, failed: 0 }
        for (const evaluator of sourceData.evaluators) {
          try {
            await tx.evaluator.upsert({
              where: { id: evaluator.id },
              update: evaluator,
              create: evaluator,
            })
            migrationResults.evaluators.success++
          } catch (error) {
            console.error(`Failed to migrate evaluator ${evaluator.id}:`, error)
            migrationResults.evaluators.failed++
          }
        }
      }
      
      // Migrate users
      if (sourceData.users && Array.isArray(sourceData.users)) {
        migrationResults.users = { success: 0, failed: 0 }
        for (const user of sourceData.users) {
          try {
            await tx.user.upsert({
              where: { id: user.id },
              update: user,
              create: user,
            })
            migrationResults.users.success++
          } catch (error) {
            console.error(`Failed to migrate user ${user.id}:`, error)
            migrationResults.users.failed++
          }
        }
      }
      
      // Migrate evaluations
      if (sourceData.evaluations && Array.isArray(sourceData.evaluations)) {
        migrationResults.evaluations = { success: 0, failed: 0 }
        for (const evaluation of sourceData.evaluations) {
          try {
            await tx.evaluation.upsert({
              where: { id: evaluation.id },
              update: evaluation,
              create: evaluation,
            })
            migrationResults.evaluations.success++
          } catch (error) {
            console.error(`Failed to migrate evaluation ${evaluation.id}:`, error)
            migrationResults.evaluations.failed++
          }
        }
      }
      
      // Migrate comments
      if (sourceData.comments && Array.isArray(sourceData.comments)) {
        migrationResults.comments = { success: 0, failed: 0 }
        for (const comment of sourceData.comments) {
          try {
            await tx.comment.upsert({
              where: { id: comment.id },
              update: comment,
              create: comment,
            })
            migrationResults.comments.success++
          } catch (error) {
            console.error(`Failed to migrate comment ${comment.id}:`, error)
            migrationResults.comments.failed++
          }
        }
      }
      
      // Migrate documents
      if (sourceData.documents && Array.isArray(sourceData.documents)) {
        migrationResults.documents = { success: 0, failed: 0 }
        for (const document of sourceData.documents) {
          try {
            await tx.document.upsert({
              where: { id: document.id },
              update: document,
              create: document,
            })
            migrationResults.documents.success++
          } catch (error) {
            console.error(`Failed to migrate document ${document.id}:`, error)
            migrationResults.documents.failed++
          }
        }
      }
      
      // Migrate chat messages
      if (sourceData.chatMessages && Array.isArray(sourceData.chatMessages)) {
        migrationResults.chatMessages = { success: 0, failed: 0 }
        for (const message of sourceData.chatMessages) {
          try {
            await tx.chatMessage.upsert({
              where: { id: message.id },
              update: message,
              create: message,
            })
            migrationResults.chatMessages.success++
          } catch (error) {
            console.error(`Failed to migrate chat message ${message.id}:`, error)
            migrationResults.chatMessages.failed++
          }
        }
      }
      
      // Migrate chat notifications
      if (sourceData.chatNotifications && Array.isArray(sourceData.chatNotifications)) {
        migrationResults.chatNotifications = { success: 0, failed: 0 }
        for (const notification of sourceData.chatNotifications) {
          try {
            await tx.chatNotification.upsert({
              where: { id: notification.id },
              update: notification,
              create: notification,
            })
            migrationResults.chatNotifications.success++
          } catch (error) {
            console.error(`Failed to migrate chat notification ${notification.id}:`, error)
            migrationResults.chatNotifications.failed++
          }
        }
      }
      
      // Migrate vendor votes
      if (sourceData.vendorVotes && Array.isArray(sourceData.vendorVotes)) {
        migrationResults.vendorVotes = { success: 0, failed: 0 }
        for (const vote of sourceData.vendorVotes) {
          try {
            await tx.vendorVote.upsert({
              where: { id: vote.id },
              update: vote,
              create: vote,
            })
            migrationResults.vendorVotes.success++
          } catch (error) {
            console.error(`Failed to migrate vendor vote ${vote.id}:`, error)
            migrationResults.vendorVotes.failed++
          }
        }
      }
      
      // Migrate admin settings
      if (sourceData.adminSettings) {
        try {
          await tx.adminSettings.upsert({
            where: { id: 1 },
            update: sourceData.adminSettings,
            create: { ...sourceData.adminSettings, id: 1 },
          })
          migrationResults.adminSettings = { success: 1, failed: 0 }
        } catch (error) {
          console.error('Failed to migrate admin settings:', error)
          migrationResults.adminSettings = { success: 0, failed: 1 }
        }
      }
      
      // Migrate evaluation drafts
      if (sourceData.evaluationDrafts && Array.isArray(sourceData.evaluationDrafts)) {
        migrationResults.evaluationDrafts = { success: 0, failed: 0 }
        for (const draft of sourceData.evaluationDrafts) {
          try {
            await tx.evaluationDraft.upsert({
              where: { id: draft.id },
              update: draft,
              create: draft,
            })
            migrationResults.evaluationDrafts.success++
          } catch (error) {
            console.error(`Failed to migrate evaluation draft ${draft.id}:`, error)
            migrationResults.evaluationDrafts.failed++
          }
        }
      }
      
      return migrationResults
    })
    
    console.log('Data migration completed with results:', result)
    return { success: true, results: result }
  } catch (error) {
    console.error('Error during data migration transaction:', error)
    return { success: false, error: error }
  } finally {
    await prisma.$disconnect()
  }
}