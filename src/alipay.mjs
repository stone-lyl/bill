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

const transferAlipayFile = () => {
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

    const getAlipayCategory = (o) => {
        if (o['交易来源地'] === '淘宝') return '购物';
        return getCategory(o['商品名称'], o['交易对方']);
    };
    const homebankRecords = filterRecords.map((o) => {
        const isOutcome = o['收/支'] === '支出';
        return {
            amount: (isOutcome ? '-' : '') + o['金额（元）'],
            memo: memo(o),
            category: getAlipayCategory(o),
            payment: 0,
            payee: o['交易对方'],
            date: format(
                new Date(o['交易创建时间'].substring(0, 10)),
                'd/M/yyyy'
            ),
            info: '',
            tags: '',
        };
    });
    console.warn(homebankRecords, '支付宝账单转换成功!!!');
    return homebankRecords;
};

qif.writeToFile(
    { cash: transferAlipayFile() },
    './qif/alipay-homebank.qif',
    () => {}
);
