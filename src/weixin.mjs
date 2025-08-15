import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import qif from 'qif';
import XLSX from 'xlsx';
import { getCategory, filterUnusedRecords } from './list.mjs';

// Function to detect file format and read accordingly
function readWeixinFile(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    
    // Check if it's an Excel file by looking at the file signature
    const isExcel = fileBuffer[0] === 0x50 && fileBuffer[1] === 0x4B; // PK signature for ZIP/Excel
    
    if (isExcel) {
        console.log('Detected Excel format, parsing as .xlsx file');
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
        
        // Find the header row with transaction data
        let headerRowIndex = -1;
        const possibleHeaders = ['交易时间', '支付时间', '记账时间', '交易单号'];
        
        for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.some(cell => possibleHeaders.some(header => cell && cell.includes(header)))) {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            console.error('Could not find transaction data headers in Excel file');
            console.log('Available rows preview:', jsonData.slice(0, 10));
            process.exit(1);
        }
        
        console.log(`Found transaction data at row ${headerRowIndex + 1}`);
        const headers = jsonData[headerRowIndex];
        const dataRows = jsonData.slice(headerRowIndex + 1);
        
        // Convert to objects
        return dataRows
            .filter(row => row && row.length > 0 && row.some(cell => cell && cell.toString().trim()))
            .map(row => {
                const record = {};
                headers.forEach((header, index) => {
                    record[header || `col_${index}`] = row[index] || '';
                });
                return record;
            });
    } else {
        console.log('Detected text format, parsing as CSV');
        const fileStr = fileBuffer.toString('utf8');
        
        // Find the start of the actual data - try multiple possible headers
        const possibleHeaders = ['交易时间', '支付时间', '记账时间', '交易单号'];
        let dataStartIndex = -1;
        let foundHeader = '';

        for (const header of possibleHeaders) {
            dataStartIndex = fileStr.indexOf(header);
            if (dataStartIndex !== -1) {
                foundHeader = header;
                break;
            }
        }

        if (dataStartIndex === -1) {
            console.error('Could not find any transaction data headers. Looking for:', possibleHeaders);
            console.log('File content preview:', fileStr.substring(0, 500));
            process.exit(1);
        }

        console.log(`Found transaction data starting with header: ${foundHeader}`);
        const csvData = fileStr.slice(dataStartIndex);

        // Manual CSV parsing to handle problematic quotes
        const lines = csvData.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        console.log('Headers found:', headers);
        
        const fileArr = [];
        // Process data lines (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Skip any lines that don't look like transaction data
            if (!line.includes(',') || line.startsWith('微信支付账单明细列表') || line.startsWith('共') || line.startsWith('注：')) {
                console.log('Skipping non-data line:', line);
                continue;
            }

            // Split the line by commas, but handle quoted values properly
            const values = [];
            let currentValue = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (char === '"') {
                    inQuotes = !inQuotes;
                    currentValue += char;
                } else if (char === ',' && !inQuotes) {
                    values.push(currentValue.trim());
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }

            if (currentValue) {
                values.push(currentValue.trim());
            }
            
            if (values.length < headers.length - 2) {
                console.log('Skipping line with insufficient values:', line);
                continue;
            }
            
            const record = {};
            for (let j = 0; j < headers.length; j++) {
                if (j < values.length) {
                    let value = values[j];
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1);
                    }
                    record[headers[j]] = value;
                } else {
                    record[headers[j]] = '';
                }
            }

            fileArr.push(record);
        }
        
        return fileArr;
    }
}

// Read the WeChat Pay bill file - check for both .csv and .xlsx extensions
function findWeixinFile() {
    const basePath = path.resolve(process.cwd(), './csv/微信支付账单');
    const possibleExtensions = ['.csv', '.xlsx'];
    
    for (const ext of possibleExtensions) {
        const filePath = basePath + ext;
        if (fs.existsSync(filePath)) {
            console.log(`Found WeChat Pay bill file: ${filePath}`);
            return filePath;
        }
    }
    
    console.error('Could not find WeChat Pay bill file. Looking for:');
    possibleExtensions.forEach(ext => {
        console.error(`  - ${basePath}${ext}`);
    });
    process.exit(1);
}

const filePath = findWeixinFile();
const fileArr = readWeixinFile(filePath);
console.log(`Parsed ${fileArr.length} transaction records`);

const transferWeixinFile = async () => {
    const homebankRecords = await fileArr
        .filter((o) => {
            return (
                o['交易对方'] !== '理财通' && !`${o['备注']}-${o['交易类型']}-${o['商品']}`.includes('红包') &&
                filterUnusedRecords(`${o['交易类型']}-${o['商品']}`, o['交易对方'])
            );
        })
        .map(async (o) => {
            const isOutcome = o['收/支'] === '支出';
            let memo = `${o['交易类型']} - ${o['商品']}`;
            if (o['备注'] !== '/') {
                memo += '：' + o['备注'];
            }
            const category = await getCategory(o['商品'], o['交易对方']);
            return {
                amount: o['金额(元)'].replace('¥', isOutcome ? '-' : ''),
                memo,
                category,
                payment: 0,
                payee: o['交易对方'],
                date: format(
                    new Date(o['交易时间']),
                    'MM-dd-yyyy'
                ),
                info: '',
                tags: '',
            };
        });
    const homebankRecordsResult = await Promise.all(homebankRecords);
    console.log('Weixin result:', homebankRecordsResult);

    return homebankRecordsResult;
};

qif.writeToFile(
    { cash: await transferWeixinFile() },
    './qif/weixin-homebank.qif',
    () => { }
);
