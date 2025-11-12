// Example API route using the new error logging utilities
// This is a reference implementation showing best practices

import { logError } from '../../lib/logger.js';
import { createAirtableRecord, updateAirtableRecord } from '../../lib/airtable.js';
import { uploadToDropbox, createDropboxFolder } from '../../lib/dropbox.js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const { orderId, customerData, files } = req.body;

  // Validate required fields
  if (!orderId) {
    return res.status(400).json({ ok: false, error: 'orderId is required' });
  }

  try {
    // Example 1: Create an Airtable record with context
    const airtableRecord = await createAirtableRecord(
      process.env.AIRTABLE_BASE_ID,
      'Orders',
      {
        OrderId: orderId,
        CustomerName: customerData?.name,
        Status: 'pending',
      },
      { orderId } // Context for error logging
    );

    // Example 2: Upload files to Dropbox with context
    if (files && files.length > 0) {
      const folderPath = `/orders/${orderId}`;
      
      // Create folder
      await createDropboxFolder(
        {
          accessToken: process.env.DROPBOX_ACCESS_TOKEN,
          folderPath,
        },
        { orderId, dropboxPath: folderPath }
      );

      // Upload each file
      for (const file of files) {
        const filePath = `${folderPath}/${file.name}`;
        await uploadToDropbox(
          filePath,
          Buffer.from(file.data, 'base64'),
          { orderId, dropboxPath: filePath }
        );
      }
    }

    // Example 3: Update the Airtable record
    await updateAirtableRecord(
      process.env.AIRTABLE_BASE_ID,
      'Orders',
      airtableRecord.id,
      {
        Status: 'uploaded',
        FilesCount: files?.length || 0,
      },
      { orderId, airtableRecordId: airtableRecord.id }
    );

    return res.status(200).json({
      ok: true,
      orderId,
      airtableRecordId: airtableRecord.id,
    });

  } catch (err) {
    // Log the error with context
    // Note: Utility functions already log their own errors,
    // but we log again at the handler level for the complete context
    logError(err, {
      endpoint: '/api/example/order',
      orderId,
      payloadPreview: {
        hasCustomerData: !!customerData,
        fileCount: files?.length || 0,
      },
    });

    // Return error response
    return res.status(500).json({
      ok: false,
      error: 'Failed to process order',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
}
