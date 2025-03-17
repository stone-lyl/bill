import qif from 'qif';
import { getCategory, filterUnusedRecords } from './list.mjs';
import parse from 'csv-parse/lib/sync.js';
import path from 'path';
import gbk from 'gbk';
import fs from 'fs';
import { format } from 'date-fns';

let fileStr = gbk.toString(
    'utf-8',
    fs.readFileSync(path.resolve(process.cwd(), './csv/alipay.csv'))
);
fileStr = fileStr.slice(
    fileStr.indexOf('-\r\n') + 3,
    fileStr.lastIndexOf('\r\n-')
);

const fileArr = parse(fileStr, {
    columns: true,
    skip_empty_lines: true,
});

let memo = (o) => `${o['交易对方']} - ${o['商品名称']}`;

/**
 * Determines the category for an Alipay transaction
 * Uses AI categorization with fallback to rule-based matching
 * @param {Object} o - The transaction object
 * @returns {Promise<string>} - The category
 */
const getAlipayCategory = async (o) => {

    // Special case rules that take precedence
    if (o['交易对方'] === '淘宝买菜') return '餐饮';
    if (o['商品名称']?.includes('电影') || o['交易对方']?.includes('电影')) return '娱乐';
    if (o['交易来源地'] === '淘宝') return '购物';

    try {
        return await getCategory(o['商品名称'], o['交易对方']);
    } catch (error) {
        console.error('Error getting category:', error);
        // Fallback to '其他' when AI fails
        return '其他';
    }
};

const transferAlipayFile = async () => {
    const newFile = fileArr.map((o) => {
        let newObj = {};
        for (const [key, value] of Object.entries(o)) {
            newObj[`${key.trim()}`] = value.trim();
        }
        return newObj;
    });
    const filterRecords = newFile.filter((o) => {
        return filterUnusedRecords(o['商品名称'], o['交易对方']);
    });

    // Process records with category detection
    const homebankRecords = [];
    for (const o of filterRecords) {
        const isOutcome = o['收/支'] === '支出';
        const category = await getAlipayCategory(o);
        homebankRecords.push({
            amount: (isOutcome ? '-' : '') + o['金额（元）'],
            memo: memo(o),
            category: category,
            payment: 0,
            payee: o['交易对方'],
            date: format(
                new Date(o['交易创建时间'].substring(0, 10)),
                'd/M/yyyy'
            ),
            info: '',
            tags: '',
        });
    }

    return homebankRecords;
};

// Main execution
const main = async () => {
    try {
        const records = await transferAlipayFile();
        console.log('Alipay result:', records);
        qif.writeToFile(
            { cash: records },
            './qif/alipay-homebank.qif',
            () => {
                console.log('Successfully converted Alipay records to QIF format');
            }
        );
    } catch (error) {
        console.error('Error processing Alipay file:', error);
    }
};

// Run the main function
main();
