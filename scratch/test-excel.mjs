import { excelService, EXCEL_FILE_PATH, EXCEL_FILE_NAME } from './lib/excel/excel-service.js';
import { DEMO_PROBLEMS } from './lib/db/seed-data.js';
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

    const allSheet = wb.getWorksheet('ALL PROBLEMS');
    const headerRow = allSheet.getRow(1).values;
    console.log('ALL PROBLEMS headers:', headerRow);

    const firstDataRow = allSheet.getRow(2).values;
    console.log('Sample Data Row 1:');
    console.log('  S.No:', firstDataRow[1]);
    console.log('  Problem ID:', firstDataRow[2]);
    console.log('  Date:', firstDataRow[3]);
    console.log('  Time:', firstDataRow[4]);
    console.log('  Category:', firstDataRow[5]);
    console.log('  Title:', firstDataRow[6]);
    console.log('  Frequency:', firstDataRow[9]);
    console.log('  Location:', firstDataRow[10]);
    console.log('  Status:', firstDataRow[12]);
  } else {
    console.error('ERROR: Excel file not found!');
  }
}

testExcel().catch(console.error);
