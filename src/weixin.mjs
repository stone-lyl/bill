import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import qif from 'qif';
import { getCategory, filterUnusedRecords } from './list.mjs';

// Read the file
let fileStr = fs.readFileSync(
    path.resolve(path.resolve(process.cwd()), './csv/微信支付账单.csv'),
    {
        encoding: 'utf8',
    }
);

// Find the start of the actual data
fileStr = fileStr.slice(fileStr.indexOf('交易时间'));

// Manual CSV parsing to handle problematic quotes
const lines = fileStr.split('\n');
const headers = lines[0].split(',').map(h => h.trim());
const fileArr = [];

// Process data lines (skip header)
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split the line by commas, but handle quoted values properly
    const values = [];
    let currentValue = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
        const char = line[j];

        if (char === '"') {
            // Toggle quote state
            inQuotes = !inQuotes;
            // Add the quote to the value
            currentValue += char;
        } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(currentValue.trim());
            currentValue = '';
        } else {
            // Add character to current value
            currentValue += char;
        }
    }

    // Add the last value
    if (currentValue) {
        values.push(currentValue.trim());
    }
    // Create an object with headers as keys
    const record = {};
    for (let j = 0; j < headers.length; j++) {
        if (j < values.length) {
            // Remove surrounding quotes if present
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
