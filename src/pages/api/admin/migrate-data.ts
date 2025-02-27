import { NextApiRequest, NextApiResponse } from 'next';
import { verifyDatabaseConnection, migrateData } from '@/lib/db-deploy';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // First verify database connection
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      return res.status(500).json({ error: 'Database connection failed. Please check your connection settings.' });
    }

    const { sourceData } = req.body;

    if (!sourceData) {
      return res.status(400).json({ error: 'No source data provided' });
    }

    // Use the enhanced migration utility
    const migrationResult = await migrateData(sourceData);
    
    if (migrationResult.success) {
      return res.status(200).json({ 
        message: 'Data migration completed successfully',
        results: migrationResult.results
      });
    } else {
      return res.status(500).json({ 
        error: 'Data migration failed',
        details: migrationResult.error
      });
    }
  } catch (error) {
    console.error('Error during data migration:', error);
    return res.status(500).json({ error: 'Failed to migrate data', details: error });
  }
}