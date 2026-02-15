import { db } from '../db/database';
import { Lead } from '../db/models';
import { GoogleSheetsService, SheetRow } from './google-sheets.service';
import { importStateService } from './import-state.service';

export interface IngestionResult {
  success: boolean;
  rowsScanned: number;
  newRowsDetected: number;
  leadsInserted: number;
  duplicatesSkipped: number;
  errors: string[];
  insertedLeads: Lead[];
}

export class LeadIngestionService {
  private googleSheetsService: GoogleSheetsService;

  constructor(serviceAccountCredentials?: any) {
    this.googleSheetsService = new GoogleSheetsService(serviceAccountCredentials);
  }

  async ingestLeads(
    configurationId: string,
    spreadsheetId: string,
    sheetName: string
  ): Promise<IngestionResult> {
    console.log('[LeadIngestion] Starting ingestion process...');
    
    const result: IngestionResult = {
      success: false,
      rowsScanned: 0,
      newRowsDetected: 0,
      leadsInserted: 0,
      duplicatesSkipped: 0,
      errors: [],
      insertedLeads: [],
    };

    try {
      const lastProcessedRow = await importStateService.getLastProcessedRow(configurationId);
      console.log(`[LeadIngestion] Last processed row: ${lastProcessedRow}`);

      const { rows, totalRows } = await this.googleSheetsService.getSheetData(
        spreadsheetId,
        sheetName,
        lastProcessedRow + 1
      );

      result.rowsScanned = rows.length;
      result.newRowsDetected = rows.length;

      console.log(`[LeadIngestion] Processing ${rows.length} new rows`);

      let lastRow = lastProcessedRow;
      let lastId: string | undefined;
      let lastTime: Date | undefined;

      for (const row of rows) {
        lastRow++;

        if (!row.id || !row.full_name || !row.phone_number) {
          console.warn(`[LeadIngestion] Skipping row ${lastRow}: Missing required fields`);
          result.errors.push(`Row ${lastRow}: Missing required fields (id, full_name, or phone_number)`);
          continue;
        }

        const duplicate = await db.checkDuplicateLead(row.id, row.email, row.phone_number);
        
        if (duplicate) {
          console.log(`[LeadIngestion] Duplicate detected for: ${row.full_name} (${row.id})`);
          result.duplicatesSkipped++;
          continue;
        }

        try {
          const users = await db.getAllUsers();
          const agents = users.filter(u => u.role === 'agent');
          const assignedUser = agents.length > 0 ? agents[0].id : users[0].id;

          const lead = await db.createLead({
            clientName: row.full_name,
            contactNumber: row.phone_number,
            email: row.email,
            source: 'Google Sheet Import',
            interestedAreas: row.configuration_you_are_looking_for_ 
              ? [row.configuration_you_are_looking_for_] 
              : [],
            interestedProjects: [],
            ownership: 'self',
            furnishing: 'unfurnished',
            assignedUserId: assignedUser,
            externalLeadId: row.id,
            platform: row.platform,
            campaignName: row.campaign_name,
            adName: row.ad_name,
            adsetName: row.adset_name,
            formName: row.form_name,
            configurationRequested: row.configuration_you_are_looking_for_,
            isOrganic: row.is_organic === 'true' || row.is_organic === '1',
            leadCreatedTime: row.created_time ? new Date(row.created_time) : undefined,
            leadStatus: row.lead_status,
          });

          result.leadsInserted++;
          result.insertedLeads.push(lead);
          console.log(`[LeadIngestion] Lead created: ${lead.clientName} (${lead.id})`);

          lastId = row.id;
          if (row.created_time) {
            lastTime = new Date(row.created_time);
          }
        } catch (error: any) {
          console.error(`[LeadIngestion] Error creating lead:`, error);
          result.errors.push(`Row ${lastRow}: ${error.message}`);
        }
      }

      await importStateService.updateState(
        configurationId,
        lastRow,
        lastId,
        lastTime
      );

      result.success = result.errors.length === 0;
      console.log(`[LeadIngestion] Ingestion complete. Inserted: ${result.leadsInserted}, Duplicates: ${result.duplicatesSkipped}, Errors: ${result.errors.length}`);

      return result;
    } catch (error: any) {
      console.error('[LeadIngestion] Fatal error:', error);
      result.errors.push(`Fatal error: ${error.message}`);
      result.success = false;
      return result;
    }
  }

  async validateConfiguration(spreadsheetId: string, sheetName: string): Promise<boolean> {
    return await this.googleSheetsService.validateAccess(spreadsheetId, sheetName);
  }
}
