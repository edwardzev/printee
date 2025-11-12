import { logError } from "./logger.js";

const API_URL = 'https://api.airtable.com/v0';

/**
 * Create a new record in Airtable
 * 
 * @param {string} baseId - Airtable base ID
 * @param {string} table - Table name
 * @param {Object} fields - Fields to set on the record
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<Object>} The created record
 */
export async function createAirtableRecord(baseId, table, fields, context = {}) {
  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Airtable create record ${response.status}: ${text}`);
    }
    return await response.json();
  } catch (err) {
    logError(err, { ...context, endpoint: "Airtable.createRecord", airtableTable: table });
    throw err;
  }
}

/**
 * Fetch a record from Airtable
 * 
 * @param {string} baseId - Airtable base ID
 * @param {string} table - Table name
 * @param {string} recordId - Record ID to fetch
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<Object>} The fetched record
 */
export async function fetchAirtableRecord(baseId, table, recordId, context = {}) {
  try {
    const url = `${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN}` 
      },
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Airtable get record ${resp.status}: ${text}`);
    }
    return resp.json();
  } catch (err) {
    logError(err, { 
      ...context, 
      endpoint: "Airtable.fetchRecord", 
      airtableRecordId: recordId,
      airtableTable: table 
    });
    throw err;
  }
}

/**
 * Update an existing record in Airtable
 * 
 * @param {string} baseId - Airtable base ID
 * @param {string} table - Table name
 * @param {string} recordId - Record ID to update
 * @param {Object} fields - Fields to update
 * @param {Object} [context={}] - Additional context for error logging
 * @returns {Promise<Object>} The updated record
 */
export async function updateAirtableRecord(baseId, table, recordId, fields, context = {}) {
  try {
    const url = `${API_URL}/${encodeURIComponent(baseId)}/${encodeURIComponent(table)}/${encodeURIComponent(recordId)}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Airtable update record ${response.status}: ${text}`);
    }
    return await response.json();
  } catch (err) {
    logError(err, { 
      ...context, 
      endpoint: "Airtable.updateRecord", 
      airtableRecordId: recordId,
      airtableTable: table 
    });
    throw err;
  }
}
