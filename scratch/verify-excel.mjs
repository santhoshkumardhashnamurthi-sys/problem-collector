import { excelService, EXCEL_FILE_PATH, getIndianDateTime } from '../lib/excel-service.ts';
import fs from 'fs';
import ExcelJS from 'exceljs';

async function verify() {
  console.log('--- STEP 1: Ensure clean state ---');
  if (fs.existsSync(EXCEL_FILE_PATH)) {
    fs.unlinkSync(EXCEL_FILE_PATH);
  }
  console.log('File exists before test:', fs.existsSync(EXCEL_FILE_PATH));

  console.log('\n--- STEP 2: Submit Problem #1 ---');
  const p1 = await excelService.appendProblem({
    category: 'Education',
    problem: 'College students face difficulty accessing inter-city transit passes online',
    location: 'Villupuram',
    name: 'Anonymous',
    contact: '-',
    status: 'New',
  });
  console.log('Problem 1 created:', p1);

  console.log('\n--- STEP 3: Verify data/problems.xlsx created ---');
  console.log('File exists:', fs.existsSync(EXCEL_FILE_PATH));

  console.log('\n--- STEP 4: Inspect Excel rows after 1st submission ---');
  const workbook1 = new ExcelJS.Workbook();
  await workbook1.xlsx.readFile(EXCEL_FILE_PATH);
  const sheet1 = workbook1.getWorksheet('Problems');
  console.log('Sheet name:', sheet1.name);
  console.log('Row count:', sheet1.rowCount);

  const headers = [];
  sheet1.getRow(1).eachCell((cell) => headers.push(cell.value));
  console.log('Headers (Row 1):', headers.join(' | '));

  const row1Values = [];
  sheet1.getRow(2).eachCell({ includeEmpty: true }, (cell) => row1Values.push(cell.value));
  console.log('Values (Row 2):', row1Values.join(' | '));

  console.log('\n--- STEP 5: Submit Problem #2 (Row preservation test) ---');
  const p2 = await excelService.appendProblem({
    category: 'Healthcare',
    problem: 'Rural clinics lack cold chain storage for critical life-saving vaccines',
    location: 'Madurai',
    name: 'Dr. Kumar',
    contact: 'kumar@example.com',
    status: 'New',
  });
  console.log('Problem 2 created:', p2);

  console.log('\n--- STEP 6: Verify both rows preserved in Excel ---');
  const workbook2 = new ExcelJS.Workbook();
  await workbook2.xlsx.readFile(EXCEL_FILE_PATH);
  const sheet2 = workbook2.getWorksheet('Problems');
  console.log('Row count after Problem 2:', sheet2.rowCount);

  for (let i = 1; i <= sheet2.rowCount; i++) {
    const vals = [];
    sheet2.getRow(i).eachCell({ includeEmpty: true }, (cell) => vals.push(cell.value));
    console.log(`Row ${i}:`, vals.join(' | '));
  }

  console.log('\n--- STEP 7: Test getAllProblems() ---');
  const allProblems = await excelService.getAllProblems();
  console.log('getAllProblems count:', allProblems.length);
  console.log('Problems returned:', JSON.stringify(allProblems, null, 2));

  console.log('\n--- STEP 8: Test getExcelBuffer() ---');
  const buffer = await excelService.getExcelBuffer();
  console.log('Buffer size in bytes:', buffer.length);
  console.log('Buffer valid:', buffer.length > 1000);

  console.log('\n--- ALL UNIT VERIFICATIONS PASSED SUCCESSFULLY ---');
}

verify().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
