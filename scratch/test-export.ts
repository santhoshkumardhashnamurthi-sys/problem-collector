import { excelService } from '../lib/excel/excel-service';
import { DEMO_PROBLEMS } from '../lib/db/seed-data';

async function testExportBuffers() {
  console.log('Testing generateBuffer for export API...');
  const buffer = await excelService.generateBuffer(DEMO_PROBLEMS);
  console.log('Generated Buffer size:', buffer.length, 'bytes');

  if (buffer.length > 5000) {
    console.log('SUCCESS: Generated valid Excel binary buffer for download!');
  } else {
    console.error('ERROR: Buffer too small!');
  }
}

testExportBuffers().catch(console.error);
