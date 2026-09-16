import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';

export const EXCEL_DIR_PATH = path.join(process.cwd(), 'data');
export const EXCEL_FILE_PATH = path.join(EXCEL_DIR_PATH, 'problems.xlsx');

export const EXCEL_COLUMNS = [
  { header: 'ID', key: 'id', width: 10 },
  { header: 'Date', key: 'date', width: 15 },
  { header: 'Time', key: 'time', width: 15 },
  { header: 'Category', key: 'category', width: 20 },
  { header: 'Problem', key: 'problem', width: 50 },
  { header: 'Location', key: 'location', width: 22 },
  { header: 'Name', key: 'name', width: 20 },
  { header: 'Contact', key: 'contact', width: 20 },
  { header: 'Status', key: 'status', width: 15 },
];

export interface ExcelProblemRow {
  id: number;
  date: string;
  time: string;
  category: string;
  problem: string;
  location: string;
  name: string;
  contact: string;
  status: string;
}

export interface AppendProblemInput {
  category: string;
  problem: string;
  location?: string;
  name?: string;
  contact?: string;
  status?: string;
}

/**
 * Format current date and time in Indian timezone (Asia/Kolkata)
 * Date format: DD-MM-YYYY (e.g. 16-09-2026)
 * Time format: hh:mm A (e.g. 07:35 PM)
 */
export function getIndianDateTime(date: Date = new Date()): { dateStr: string; timeStr: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const day = parts.find((p) => p.type === 'day')?.value || '';
    const month = parts.find((p) => p.type === 'month')?.value || '';
    const year = parts.find((p) => p.type === 'year')?.value || '';
    let hour = parts.find((p) => p.type === 'hour')?.value || '12';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    const dayPeriod = parts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase() || 'AM';

    // Ensure 2-digit hour
    hour = hour.padStart(2, '0');

    const dateStr = `${day}-${month}-${year}`;
    const timeStr = `${hour}:${minute} ${dayPeriod}`;

    return { dateStr, timeStr };
  } catch (err) {
    console.error('[EXCEL_TIMEZONE_ERROR] Failed to format Asia/Kolkata time:', err);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return { dateStr, timeStr };
  }
}

/**
 * Style header row for Excel worksheet
 */
function applyWorksheetStyles(worksheet: ExcelJS.Worksheet) {
  // Freeze header row
  worksheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

  // Style Header Row (Row 1)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Dark charcoal/slate
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Enable Auto-filter on columns A to I
  worksheet.autoFilter = 'A1:I1';

  // Set explicit column widths
  EXCEL_COLUMNS.forEach((col, idx) => {
    const worksheetCol = worksheet.getColumn(idx + 1);
    worksheetCol.width = col.width;
  });
}

/**
 * Apply styling to an individual data row
 */
function styleDataRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF101114' } };
    cell.alignment = {
      vertical: 'middle',
      horizontal: [1, 2, 3, 9].includes(colNum) ? 'center' : 'left',
      wrapText: colNum === 5, // Wrap Problem text
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  });
}

/**
 * Serialized in-process mutex to avoid write concurrency conflicts
 */
class Mutex {
  private queue: Promise<void> = Promise.resolve();

  dispatch<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const res = await fn();
          resolve(res);
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}

export class ExcelService {
  private mutex = new Mutex();

  /**
   * Ensures data directory and problems.xlsx exist with required header columns
   */
  async ensureInitialized(): Promise<void> {
    if (!fs.existsSync(EXCEL_DIR_PATH)) {
      fs.mkdirSync(EXCEL_DIR_PATH, { recursive: true });
    }

    if (!fs.existsSync(EXCEL_FILE_PATH)) {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'CodeArtix Problem Collector';
      workbook.created = new Date();
      workbook.modified = new Date();

      const sheet = workbook.addWorksheet('Problems');
      sheet.columns = EXCEL_COLUMNS;
      applyWorksheetStyles(sheet);

      await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
      console.log(`[EXCEL_INIT] Successfully initialized ${EXCEL_FILE_PATH}`);
    }
  }

  /**
   * Reads all stored problem records from data/problems.xlsx
   */
  async getAllProblems(): Promise<ExcelProblemRow[]> {
    return this.mutex.dispatch(async () => {
      await this.ensureInitialized();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      const sheet = workbook.getWorksheet('Problems') || workbook.getWorksheet(1);

      if (!sheet) {
        return [];
      }

      const rows: ExcelProblemRow[] = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip headers

        const idVal = row.getCell(1).value;
        const id = typeof idVal === 'number' ? idVal : parseInt(String(idVal || 0), 10);
        if (!id) return;

        const date = String(row.getCell(2).value || '');
        const time = String(row.getCell(3).value || '');
        const category = String(row.getCell(4).value || '');
        const problem = String(row.getCell(5).value || '');
        const location = String(row.getCell(6).value || '-');
        const name = String(row.getCell(7).value || 'Anonymous');
        const contact = String(row.getCell(8).value || '-');
        const status = String(row.getCell(9).value || 'New');

        rows.push({
          id,
          date,
          time,
          category,
          problem,
          location,
          name,
          contact,
          status,
        });
      });

      return rows;
    });
  }

  /**
   * Appends a new problem to data/problems.xlsx
   * Preserves all existing rows, generates sequential ID, formats Asia/Kolkata date & time.
   */
  async appendProblem(input: AppendProblemInput): Promise<ExcelProblemRow> {
    return this.mutex.dispatch(async () => {
      await this.ensureInitialized();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      const sheet = workbook.getWorksheet('Problems') || workbook.getWorksheet(1);

      if (!sheet) {
        throw new Error('Worksheet "Problems" not found in Excel file');
      }

      // Determine next sequential ID
      let maxId = 0;
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const idVal = row.getCell(1).value;
        const id = typeof idVal === 'number' ? idVal : parseInt(String(idVal || 0), 10);
        if (id > maxId) {
          maxId = id;
        }
      });
      const nextId = maxId + 1;

      // Get current Indian Standard Time (Asia/Kolkata)
      const { dateStr, timeStr } = getIndianDateTime(new Date());

      const record: ExcelProblemRow = {
        id: nextId,
        date: dateStr,
        time: timeStr,
        category: input.category || 'General',
        problem: input.problem || '',
        location: input.location && input.location.trim() ? input.location.trim() : '-',
        name: input.name && input.name.trim() ? input.name.trim() : 'Anonymous',
        contact: input.contact && input.contact.trim() ? input.contact.trim() : '-',
        status: input.status && input.status.trim() ? input.status.trim() : 'New',
      };

      const newRow = sheet.addRow([
        record.id,
        record.date,
        record.time,
        record.category,
        record.problem,
        record.location,
        record.name,
        record.contact,
        record.status,
      ]);

      styleDataRow(newRow);

      // Persist the updated Excel file
      await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
      console.log(`[EXCEL_ROW_ADDED] Appended row #${record.id} to ${EXCEL_FILE_PATH}`);

      return record;
    });
  }

  /**
   * Returns the Excel file as a binary Buffer for download / export
   */
  async getExcelBuffer(): Promise<Buffer> {
    return this.mutex.dispatch(async () => {
      await this.ensureInitialized();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(EXCEL_FILE_PATH);
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    });
  }

  /**
   * Returns the absolute path of the Excel file
   */
  getFilePath(): string {
    return EXCEL_FILE_PATH;
  }
}

export const excelService = new ExcelService();
