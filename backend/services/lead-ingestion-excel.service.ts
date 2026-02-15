import { db } from '../db/database';
import { ImportStateService } from './import-state.service';
import { ExcelFileService, ExcelRow } from './excel-file.service';

export class ExcelLeadIngestionService {
  private importStateService: ImportStateService;
  private excelService: ExcelFileService;

  constructor(excelFilePath: string) {
    this.importStateService = new ImportStateService();
    this.excelService = new ExcelFileService(excelFilePath);
  }

  async ingestLeads(configurationId: string): Promise<{
    success: boolean;
    rowsScanned: number;
    newRowsDetected: number;
    leadsInserted: number;
    duplicatesSkipped: number;
    errors: string[];
    insertedLeads: any[];
  }> {
    console.log('[Excel Ingestion] Starting lead ingestion...');

    const result = {
      success: true,
      rowsScanned: 0,
      newRowsDetected: 0,
      leadsInserted: 0,
      duplicatesSkipped: 0,
      errors: [] as string[],
      insertedLeads: [] as any[],
    };

    try {
      if (!this.excelService.fileExists()) {
        throw new Error('Excel file not found');
      }

      const rows = await this.excelService.readLeadsFromExcel();
      result.rowsScanned = rows.length;

      const lastProcessedRow = await this.importStateService.getLastProcessedRow(configurationId);

      console.log(`[Excel Ingestion] Last processed row: ${lastProcessedRow}`);
      console.log(`[Excel Ingestion] Total rows: ${rows.length}`);

      if (rows.length <= lastProcessedRow) {
        console.log('[Excel Ingestion] No new rows to process');
        return result;
      }

      const newRows = rows.slice(lastProcessedRow);
      result.newRowsDetected = newRows.length;
      console.log(`[Excel Ingestion] Processing ${newRows.length} new rows...`);

      const existingLeads = await db.getLeads({});
      const existingLeadsMap = new Map();
      for (const lead of existingLeads) {
        if (lead.externalLeadId) existingLeadsMap.set(`id:${lead.externalLeadId}`, lead);
        if (lead.email) existingLeadsMap.set(`email:${lead.email}`, lead);
        if (lead.contactNumber) existingLeadsMap.set(`phone:${lead.contactNumber}`, lead);
      }

      for (let i = 0; i < newRows.length; i++) {
        const row = newRows[i];
        const rowNumber = lastProcessedRow + i + 1;

        try {
          const isDuplicate = this.checkDuplicate(row, existingLeadsMap);

          if (isDuplicate) {
            console.log(`[Excel Ingestion] Row ${rowNumber} is duplicate, skipping...`);
            result.duplicatesSkipped++;
            await this.importStateService.updateState(
              configurationId,
              rowNumber,
              row.id || row.external_id || undefined,
              row.timestamp || row.date ? new Date(row.timestamp || row.date) : new Date()
            );
            continue;
          }

          const lead = await this.parseAndInsertLead(row);
          result.leadsInserted++;
          result.insertedLeads.push(lead);

          if (lead.externalLeadId) existingLeadsMap.set(`id:${lead.externalLeadId}`, lead);
          if (lead.email) existingLeadsMap.set(`email:${lead.email}`, lead);
          if (lead.contactNumber) existingLeadsMap.set(`phone:${lead.contactNumber}`, lead);

          await this.importStateService.updateState(
            configurationId,
            rowNumber,
            row.id || row.external_id || undefined,
            row.timestamp || row.date ? new Date(row.timestamp || row.date) : new Date()
          );

          console.log(`[Excel Ingestion] Row ${rowNumber} inserted successfully`);
        } catch (error: any) {
          console.error(`[Excel Ingestion] Error processing row ${rowNumber}:`, error.message);
          result.errors.push(`Row ${rowNumber}: ${error.message}`);
          result.success = false;
        }
      }

      console.log(`[Excel Ingestion] Completed: ${result.leadsInserted} leads inserted, ${result.duplicatesSkipped} duplicates skipped`);
    } catch (error: any) {
      console.error('[Excel Ingestion] Fatal error:', error.message);
      result.errors.push(error.message);
      result.success = false;
    }

    return result;
  }

  private checkDuplicate(row: ExcelRow, existingLeadsMap: Map<string, any>): boolean {
    const externalId = row.id || row.external_id || row.lead_id;
    const email = row.email;
    const phone = row.phone || row.phone_number || row.contact_number;

    if (externalId && existingLeadsMap.has(`id:${externalId}`)) return true;
    if (email && existingLeadsMap.has(`email:${email}`)) return true;
    if (phone && existingLeadsMap.has(`phone:${phone}`)) return true;

    return false;
  }

  private async parseAndInsertLead(row: ExcelRow): Promise<any> {
    const leadData = {
      externalLeadId: row.id || row.external_id || row.lead_id || undefined,
      clientName: row.name || row.client_name || row.full_name || 'Unknown',
      email: row.email || undefined,
      contactNumber: row.phone || row.phone_number || row.contact_number || 'N/A',
      source: row.source || 'Excel Import',
      interestedAreas: row.interested_areas ? row.interested_areas.split(',').map((a: string) => a.trim()) : [],
      interestedProjects: row.interested_projects ? row.interested_projects.split(',').map((p: string) => p.trim()) : [],
      ownership: (row.ownership === 'investment' ? 'investment' : 'self') as 'self' | 'investment',
      furnishing: (['unfurnished', 'semi', 'fully'].includes(row.furnishing) ? row.furnishing : 'unfurnished') as 'unfurnished' | 'semi' | 'fully',
      assignedUserId: row.assigned_user_id || 'user-3',
      platform: row.platform || 'Excel File',
      campaignName: row.campaign_name || undefined,
      adName: row.ad_name || undefined,
      adsetName: row.adset_name || undefined,
      formName: row.form_name || undefined,
      configurationRequested: row.configuration_requested || undefined,
      isOrganic: row.is_organic === 'true' || row.is_organic === true || undefined,
      leadCreatedTime: row.lead_created_time ? new Date(row.lead_created_time) : undefined,
      leadStatus: row.lead_status || undefined,
    };

    const lead = await db.createLead(leadData);
    console.log(`[Excel Ingestion] Created lead: ${lead.clientName} (${lead.id})`);
    return lead;
  }
}
