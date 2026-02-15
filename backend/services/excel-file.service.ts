import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ExcelRow {
  [key: string]: any;
}

export class ExcelFileService {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async readLeadsFromExcel(): Promise<ExcelRow[]> {
    try {
      console.log(`[Excel] Reading file: ${this.filePath}`);
      
      if (!fs.existsSync(this.filePath)) {
        throw new Error(`Excel file not found at: ${this.filePath}`);
      }

      const workbook = XLSX.readFile(this.filePath);
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('No sheets found in Excel file');
      }

      console.log(`[Excel] Reading sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      console.log(`[Excel] Found ${data.length} rows`);
      return data as ExcelRow[];
    } catch (error: any) {
      console.error('[Excel] Error reading file:', error.message);
      throw error;
    }
  }

  fileExists(): boolean {
    return fs.existsSync(this.filePath);
  }

  getLastModified(): Date | null {
    try {
      const stats = fs.statSync(this.filePath);
      return stats.mtime;
    } catch {
      return null;
    }
  }
}
