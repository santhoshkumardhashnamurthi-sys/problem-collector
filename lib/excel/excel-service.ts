import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { Problem } from '../db/schema';

export const EXCEL_FILE_NAME = 'Problem_Collector_Data.xlsx';
export const EXCEL_FILE_PATH = path.join(process.cwd(), EXCEL_FILE_NAME);

// Standard columns for problem tables
export interface ProblemExcelRow {
  sNo: number;
  problemId: string;
  date: string;
  time: string;
  category: string;
  problemTitle: string;
  problemDescription: string;
  whoFacesThis: string;
  frequency: string;
  location: string;
  submitter: string;
  status: string;
  createdAt: string;
}

/**
 * Format a database ISO timestamp into Date (DD-MM-YYYY) and Time (hh:mm A)
 */
export function formatDateTime(isoString: string): { dateStr: string; timeStr: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return { dateStr: 'N/A', timeStr: 'N/A' };
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    const hoursStr = String(hours).padStart(2, '0');
    const timeStr = `${hoursStr}:${minutes} ${ampm}`;

    return { dateStr, timeStr };
  } catch {
    return { dateStr: 'N/A', timeStr: 'N/A' };
  }
}

/**
 * Map a Problem database entity to an Excel row object
 */
export function mapProblemToRow(p: Problem, sNo: number): ProblemExcelRow {
  const { dateStr, timeStr } = formatDateTime(p.created_at);
  const locParts = [p.area, p.city].filter(Boolean);
  const location = locParts.length > 0 ? locParts.join(', ') : 'Not specified';

  return {
    sNo,
    problemId: p.problem_code || p.id,
    date: dateStr,
    time: timeStr,
    category: p.category_name || 'General',
    problemTitle: p.normalized_problem || p.raw_description,
    problemDescription: p.raw_description,
    whoFacesThis: p.user_type || 'General Public',
    frequency: p.frequency || 'Occasional',
    location,
    submitter: p.submitter_name || (p.is_anonymous ? 'Anonymous' : 'Community Contributor'),
    status: p.status ? p.status.toUpperCase() : 'ACTIVE',
    createdAt: p.created_at,
  };
}

/**
 * Applies professional styling to a worksheet
 */
function styleWorksheet(
  worksheet: ExcelJS.Worksheet,
  headers: string[],
  colWidths?: number[]
) {
  // 1. Freeze top row
  worksheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

  // 2. Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;

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
      fgColor: { argb: 'FF1E293B' }, // Dark Slate / Charcoal
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

  // 3. Enable Auto-filter on header
  if (headers.length > 0) {
    const lastColLetter = getColumnLetter(headers.length);
    worksheet.autoFilter = `A1:${lastColLetter}1`;
  }

  // 4. Auto-fit column widths if not explicitly provided
  worksheet.columns.forEach((col, index) => {
    if (colWidths && colWidths[index]) {
      col.width = colWidths[index];
    } else {
      let maxLen = headers[index] ? headers[index].length : 12;
      col.eachCell?.({ includeEmpty: false }, (cell, rowNum) => {
        if (rowNum > 1) {
          const val = cell.value ? cell.value.toString() : '';
          if (val.length > maxLen) {
            maxLen = Math.min(val.length, 50); // Cap width at 50 for readability
          }
        }
      });
      col.width = Math.max(maxLen + 4, 12);
    }
  });
}

function getColumnLetter(colIndex: number): string {
  let letter = '';
  while (colIndex > 0) {
    const mod = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    colIndex = Math.floor((colIndex - mod) / 26);
  }
  return letter;
}

/**
 * Builds the complete multi-sheet Excel Workbook from an array of Problems.
 */
export function buildWorkbookFromProblems(problems: Problem[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CodeArtix Problem Collector';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Sort newest first
  const sortedProblems = [...problems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const problemHeaders = [
    'S.No',
    'Problem ID',
    'Date',
    'Time',
    'Category',
    'Problem Title',
    'Problem Description',
    'Who Faces This',
    'Frequency',
    'Location',
    'Submitter',
    'Status',
    'Created At',
  ];

  // Helper to add problems to a problem sheet
  const populateProblemSheet = (sheet: ExcelJS.Worksheet, items: Problem[]) => {
    sheet.addRow(problemHeaders);

    items.forEach((p, idx) => {
      const rowData = mapProblemToRow(p, idx + 1);
      const row = sheet.addRow([
        rowData.sNo,
        rowData.problemId,
        rowData.date,
        rowData.time,
        rowData.category,
        rowData.problemTitle,
        rowData.problemDescription,
        rowData.whoFacesThis,
        rowData.frequency,
        rowData.location,
        rowData.submitter,
        rowData.status,
        rowData.createdAt,
      ]);

      row.height = 22;
      row.eachCell((cell, colNum) => {
        cell.font = { name: 'Calibri', size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: [1, 2, 3, 4, 9, 12].includes(colNum) ? 'center' : 'left',
          wrapText: [6, 7].includes(colNum),
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    styleWorksheet(sheet, problemHeaders, [
      8,   // S.No
      18,  // Problem ID
      14,  // Date
      12,  // Time
      16,  // Category
      32,  // Title
      45,  // Description
      18,  // Who Faces
      14,  // Frequency
      20,  // Location
      24,  // Submitter
      12,  // Status
      24,  // Created At
    ]);
  };

  // -------------------------------------------------------------
  // 1. ALL PROBLEMS
  // -------------------------------------------------------------
  const allProblemsSheet = workbook.addWorksheet('ALL PROBLEMS');
  populateProblemSheet(allProblemsSheet, sortedProblems);

  // -------------------------------------------------------------
  // 2. CATEGORY SUMMARY
  // -------------------------------------------------------------
  const catSummarySheet = workbook.addWorksheet('CATEGORY SUMMARY');
  const catHeaders = ['Category', 'Total Problems'];
  catSummarySheet.addRow(catHeaders);

  const categoryMap: Record<string, number> = {};
  sortedProblems.forEach((p) => {
    const cat = p.category_name || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });

  Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      const r = catSummarySheet.addRow([cat, count]);
      r.height = 20;
      r.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
      r.getCell(2).font = { name: 'Calibri', size: 10 };
      r.getCell(2).alignment = { horizontal: 'center' };
    });
  styleWorksheet(catSummarySheet, catHeaders, [25, 18]);

  // -------------------------------------------------------------
  // 3. DAILY SUMMARY
  // -------------------------------------------------------------
  const dailySummarySheet = workbook.addWorksheet('DAILY SUMMARY');
  const dailyHeaders = ['Date', 'Total Problems'];
  dailySummarySheet.addRow(dailyHeaders);

  const dailyMap: Record<string, number> = {};
  sortedProblems.forEach((p) => {
    const { dateStr } = formatDateTime(p.created_at);
    dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
  });

  Object.entries(dailyMap).forEach(([dateStr, count]) => {
    const r = dailySummarySheet.addRow([dateStr, count]);
    r.height = 20;
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(2).font = { name: 'Calibri', size: 10 };
    r.getCell(2).alignment = { horizontal: 'center' };
  });
  styleWorksheet(dailySummarySheet, dailyHeaders, [20, 18]);

  // -------------------------------------------------------------
  // 4. STATUS SUMMARY
  // -------------------------------------------------------------
  const statusSummarySheet = workbook.addWorksheet('STATUS SUMMARY');
  const statusHeaders = ['Status', 'Total Problems'];
  statusSummarySheet.addRow(statusHeaders);

  const statusMap: Record<string, number> = {};
  sortedProblems.forEach((p) => {
    const st = (p.status || 'ACTIVE').toUpperCase();
    statusMap[st] = (statusMap[st] || 0) + 1;
  });

  Object.entries(statusMap).forEach(([st, count]) => {
    const r = statusSummarySheet.addRow([st, count]);
    r.height = 20;
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
    r.getCell(2).font = { name: 'Calibri', size: 10 };
    r.getCell(2).alignment = { horizontal: 'center' };
  });
  styleWorksheet(statusSummarySheet, statusHeaders, [20, 18]);

  // -------------------------------------------------------------
  // 5. MONTHLY SUMMARY
  // -------------------------------------------------------------
  const monthlySummarySheet = workbook.addWorksheet('MONTHLY SUMMARY');
  const monthlyHeaders = ['Month', 'Total Problems'];
  monthlySummarySheet.addRow(monthlyHeaders);

  const monthlyMap: Record<string, number> = {};
  sortedProblems.forEach((p) => {
    try {
      const d = new Date(p.created_at);
      const monthStr = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      monthlyMap[monthStr] = (monthlyMap[monthStr] || 0) + 1;
    } catch {
      monthlyMap['Unknown'] = (monthlyMap['Unknown'] || 0) + 1;
    }
  });

  Object.entries(monthlyMap).forEach(([monthStr, count]) => {
    const r = monthlySummarySheet.addRow([monthStr, count]);
    r.height = 20;
    r.getCell(1).font = { name: 'Calibri', size: 10, bold: true };
    r.getCell(2).font = { name: 'Calibri', size: 10 };
    r.getCell(2).alignment = { horizontal: 'center' };
  });
  styleWorksheet(monthlySummarySheet, monthlyHeaders, [24, 18]);

  // -------------------------------------------------------------
  // 6. CATEGORY-WISE WORKSHEETS
  // -------------------------------------------------------------
  // Ensure every category present gets its own sheet
  const categoriesPresent = Array.from(
    new Set(sortedProblems.map((p) => p.category_name || 'General'))
  );

  categoriesPresent.forEach((catName) => {
    const cleanSheetName = catName.slice(0, 31); // Excel worksheet name limit is 31 chars
    // Avoid duplicate names if truncated
    if (!workbook.getWorksheet(cleanSheetName)) {
      const catSheet = workbook.addWorksheet(cleanSheetName);
      const categoryProblems = sortedProblems.filter(
        (p) => (p.category_name || 'General').toLowerCase() === catName.toLowerCase()
      );
      populateProblemSheet(catSheet, categoryProblems);
    }
  });

  return workbook;
}

/**
 * Excel Service Singleton
 */
export class ExcelService {
  /**
   * Persists or updates the master Problem_Collector_Data.xlsx file from a given list of problems.
   */
  async saveMasterExcel(problems: Problem[]): Promise<string> {
    const workbook = buildWorkbookFromProblems(problems);
    await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
    return EXCEL_FILE_PATH;
  }

  /**
   * Generates a dynamic binary buffer for downloading/exporting
   */
  async generateBuffer(problems: Problem[]): Promise<Buffer> {
    const workbook = buildWorkbookFromProblems(problems);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Appends or syncs a new problem to the master Excel file.
   * Reads existing problems from disk if available, adds the new problem (or updates),
   * and saves the master file.
   */
  async appendProblem(newProblem: Problem, allProblemsProvider?: () => Promise<Problem[]>): Promise<void> {
    try {
      let problemList: Problem[] = [];

      if (allProblemsProvider) {
        problemList = await allProblemsProvider();
      }

      // Ensure the new problem is included
      const existingIdx = problemList.findIndex((p) => p.id === newProblem.id || p.problem_code === newProblem.problem_code);
      if (existingIdx >= 0) {
        problemList[existingIdx] = newProblem;
      } else {
        problemList.unshift(newProblem);
      }

      await this.saveMasterExcel(problemList);
      console.log(`[EXCEL_SUCCESS] Updated ${EXCEL_FILE_NAME} with problem ${newProblem.problem_code}`);
    } catch (err) {
      console.error(`[EXCEL_ERROR] Failed to update ${EXCEL_FILE_NAME}:`, err);
      // We log but do not crash the request if disk write fails
    }
  }
}

export const excelService = new ExcelService();
