import { excelService, EXCEL_FILE_PATH, EXCEL_FILE_NAME } from '../lib/excel/excel-service';
import { DEMO_PROBLEMS } from '../lib/db/seed-data';
import ExcelJS from 'exceljs';
import fs from 'fs';

async function testExcel() {
  console.log('Testing Excel creation with', DEMO_PROBLEMS.length, 'problems...');
  await excelService.saveMasterExcel(DEMO_PROBLEMS);

  if (fs.existsSync(EXCEL_FILE_PATH)) {
    console.log('SUCCESS: Excel file created at:', EXCEL_FILE_PATH);
    const stats = fs.statSync(EXCEL_FILE_PATH);
    console.log('File size:', stats.size, 'bytes');

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(EXCEL_FILE_PATH);

    console.log('Sheets found in workbook:');
    wb.worksheets.forEach((ws, idx) => {
      console.log(`  [${idx + 1}] "${ws.name}" (${ws.rowCount} rows, ${ws.columnCount} columns)`);
    });

    const allSheet = wb.getWorksheet('ALL PROBLEMS')!;
    const headerRow = allSheet.getRow(1).values;
    console.log('ALL PROBLEMS headers:', headerRow);

    const firstDataRow = allSheet.getRow(2).values as any[];
    console.log('Sample Data Row 1:');
    console.log('  S.No:', firstDataRow[1]);
    console.log('  Problem ID:', firstDataRow[2]);
    console.log('  Date (DD-MM-YYYY):', firstDataRow[3]);
    console.log('  Time (hh:mm A):', firstDataRow[4]);
    console.log('  Category:', firstDataRow[5]);
    console.log('  Title:', firstDataRow[6]);
    console.log('  Description:', firstDataRow[7]);
    console.log('  Who Faces This:', firstDataRow[8]);
    console.log('  Frequency:', firstDataRow[9]);
    console.log('  Location:', firstDataRow[10]);
    console.log('  Submitter:', firstDataRow[11]);
    console.log('  Status:', firstDataRow[12]);
    console.log('  Created At:', firstDataRow[13]);

    const catSummary = wb.getWorksheet('CATEGORY SUMMARY')!;
    console.log('CATEGORY SUMMARY Rows:');
    catSummary.eachRow((r, rowNum) => {
      console.log(`  Row ${rowNum}:`, r.values);
    });

    const dailySummary = wb.getWorksheet('DAILY SUMMARY')!;
    console.log('DAILY SUMMARY Rows:');
    dailySummary.eachRow((r, rowNum) => {
      console.log(`  Row ${rowNum}:`, r.values);
    });

    const statusSummary = wb.getWorksheet('STATUS SUMMARY')!;
    console.log('STATUS SUMMARY Rows:');
    statusSummary.eachRow((r, rowNum) => {
      console.log(`  Row ${rowNum}:`, r.values);
    });

    const monthlySummary = wb.getWorksheet('MONTHLY SUMMARY')!;
    console.log('MONTHLY SUMMARY Rows:');
    monthlySummary.eachRow((r, rowNum) => {
      console.log(`  Row ${rowNum}:`, r.values);
    });
  } else {
    console.error('ERROR: Excel file not found!');
  }
}

testExcel().catch(console.error);
