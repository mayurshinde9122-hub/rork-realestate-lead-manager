# Excel File Import Setup Guide

## Overview
Your backend can now monitor a local Excel file on your Windows server and automatically import new leads every 10 minutes.

## Setup Instructions

### 1. Set Environment Variable

Add this to your `.env` file or set it in your Windows environment:

```env
EXCEL_FILE_PATH=C:\path\to\your\leads.xlsx
```

**Example:**
```env
EXCEL_FILE_PATH=C:\Users\proje\OneDrive\Documents\leads\new_leads.xlsx
```

### 2. Excel File Format

Your Excel file should have these columns (first row as headers):

| Column Name | Required | Description |
|-------------|----------|-------------|
| id | Optional | Unique lead identifier |
| name | Required | Client name |
| email | Optional | Email address |
| phone | Optional | Phone number |
| property_type | Optional | Type of property (Residential/Commercial) |
| location | Optional | Property location |
| budget | Optional | Budget amount |
| status | Optional | Lead status (new/contacted/qualified) |
| priority | Optional | Priority (low/medium/high) |
| notes | Optional | Additional notes |
| source | Optional | Lead source |
| platform | Optional | Platform name |

**Example Excel:**
```
| id    | name       | email              | phone         | property_type | location | budget  | status | priority |
|-------|------------|--------------------|---------------|---------------|----------|---------|--------|----------|
| L001  | John Doe   | john@email.com     | 555-1234      | Residential   | Mumbai   | 5000000 | new    | high     |
| L002  | Jane Smith | jane@email.com     | 555-5678      | Commercial    | Delhi    | 8000000 | new    | medium   |
```

### 3. How It Works

1. **Every 10 minutes**, the scheduler checks your Excel file
2. **Reads new rows** (only rows that haven't been processed before)
3. **Checks for duplicates** (by ID, email, or phone)
4. **Inserts new leads** into your database
5. **Sends notifications** to all agents/managers
6. **Tracks progress** - remembers the last processed row

### 4. Important Notes

✅ **Append-only**: Only add new leads at the bottom of the Excel file
❌ **Don't sort** or reorder rows - this will break the import tracking
✅ **Leave file open**: The system can read the file even if Excel has it open
✅ **Automatic deduplication**: Duplicate leads (same ID/email/phone) are automatically skipped

### 5. Start Your Server

```bash
# Set the environment variable in PowerShell
$env:EXCEL_FILE_PATH="C:\path\to\your\leads.xlsx"

# Start the backend
npx tsx backend/server.ts --host 0.0.0.0
```

Or create a `.env` file:
```env
PORT=3000
EXCEL_FILE_PATH=C:\Users\proje\OneDrive\Documents\leads\new_leads.xlsx
```

### 6. Verify It's Working

Watch your console logs for:
```
[Scheduler] Starting lead import scheduler (every 10 minutes)...
[Scheduler] === STARTING SCHEDULED IMPORT ===
[Scheduler] Using Excel file import from: C:\path\to\your\leads.xlsx
[Excel] Reading file: C:\path\to\your\leads.xlsx
[Excel] Found 15 rows
[Excel Ingestion] Processing 5 new rows...
[Scheduler] === IMPORT COMPLETED in 250ms ===
[Scheduler] Results: { success: true, leadsInserted: 5, duplicatesSkipped: 0, errors: 0 }
```

## Switching Between Excel and Google Sheets

- **If `EXCEL_FILE_PATH` is set**: System uses Excel file monitoring
- **If `EXCEL_FILE_PATH` is NOT set**: System uses Google Sheets import

You can use both methods:
1. Remove `EXCEL_FILE_PATH` to use Google Sheets
2. Set `EXCEL_FILE_PATH` to use Excel file

## Troubleshooting

### File Not Found
```
Error: Excel file not found at: C:\path\to\your\leads.xlsx
```
**Solution**: Check the file path and make sure the file exists

### No New Rows
```
[Excel Ingestion] No new rows to process
```
**Solution**: Add new rows to the bottom of your Excel file

### Permission Denied
```
Error: EACCES: permission denied
```
**Solution**: Make sure the backend has read permissions for the Excel file

## Testing

1. Create a test Excel file with 2-3 sample leads
2. Set `EXCEL_FILE_PATH` environment variable
3. Start your backend
4. Wait 10 minutes (or trigger manually via code)
5. Check logs for import results
6. Add 1-2 more leads to the Excel file
7. Wait 10 minutes
8. Verify only new leads were imported
