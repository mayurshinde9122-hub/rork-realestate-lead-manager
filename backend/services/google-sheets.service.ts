import { google } from 'googleapis';

export interface SheetRow {
  id: string;
  created_time: string;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
  is_organic?: string;
  platform?: string;
  configuration_you_are_looking_for_?: string;
  email?: string;
  full_name?: string;
  phone_number?: string;
  lead_status?: string;
}

export class GoogleSheetsService {
  private sheets: any;

  constructor(serviceAccountCredentials?: any) {
    if (serviceAccountCredentials) {
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccountCredentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      this.sheets = google.sheets({ version: 'v4', auth });
    }
  }

  async getSheetData(
    spreadsheetId: string,
    sheetName: string,
    startRow: number = 2
  ): Promise<{ rows: SheetRow[]; totalRows: number }> {
    console.log(`[GoogleSheets] Fetching data from sheet: ${sheetName}, starting at row: ${startRow}`);

    try {
      const range = `${sheetName}!A${startRow}:Q`;
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const values = response.data.values || [];
      console.log(`[GoogleSheets] Fetched ${values.length} rows`);

      const rows: SheetRow[] = values.map((row: string[], index: number) => ({
        id: row[0] || '',
        created_time: row[1] || '',
        ad_id: row[2] || undefined,
        ad_name: row[3] || undefined,
        adset_id: row[4] || undefined,
        adset_name: row[5] || undefined,
        campaign_id: row[6] || undefined,
        campaign_name: row[7] || undefined,
        form_id: row[8] || undefined,
        form_name: row[9] || undefined,
        is_organic: row[10] || undefined,
        platform: row[11] || undefined,
        configuration_you_are_looking_for_: row[12] || undefined,
        email: row[13] || undefined,
        full_name: row[14] || undefined,
        phone_number: row[15] || undefined,
        lead_status: row[16] || undefined,
      }));

      const allRowsResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:A`,
      });
      const totalRows = (allRowsResponse.data.values || []).length;

      return { rows, totalRows };
    } catch (error: any) {
      console.error('[GoogleSheets] Error fetching data:', error.message);
      throw new Error(`Failed to fetch Google Sheets data: ${error.message}`);
    }
  }

  async validateAccess(spreadsheetId: string, sheetName: string): Promise<boolean> {
    try {
      console.log(`[GoogleSheets] Validating access to spreadsheet: ${spreadsheetId}`);
      
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId,
      });

      const sheets = response.data.sheets || [];
      const sheetExists = sheets.some((s: any) => s.properties.title === sheetName);

      if (!sheetExists) {
        console.error(`[GoogleSheets] Sheet "${sheetName}" not found`);
        return false;
      }

      console.log('[GoogleSheets] Access validated successfully');
      return true;
    } catch (error: any) {
      console.error('[GoogleSheets] Validation failed:', error.message);
      return false;
    }
  }

  static extractSpreadsheetId(url: string): string | null {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
