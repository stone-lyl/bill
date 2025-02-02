import parse from 'csv-parse/lib/sync.js';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';
import qif from 'qif';
import { getCategory, filterUnusedRecords } from './list.mjs';

let fileStr = fs.readFileSync(
    path.resolve(path.resolve(process.cwd()), './csv/微信支付账单.csv'),
    {
        encoding: 'utf8',
    }
);

fileStr = fileStr.slice(fileStr.indexOf('交易时间'));
const fileArr = parse(fileStr, {
    columns: true,
    skip_empty_lines: true,
});

const transferWeixinFile = () => {
    const homebankRecords = fileArr
        .filter((o) => {
            return (
                o['交易对方'] !== '理财通' &&
                filterUnusedRecords(o['商品'], o['交易对方'])
            );
        })
        .map((o) => {
            const isOutcome = o['收/支'] === '支出';
            let memo = `${o['交易类型']} - ${o['商品']}`;
            if (o['备注'] !== '/') {
                memo += '：' + o['备注'];
            }
            return {
                amount: o['金额(元)'].replace('¥', isOutcome ? '-' : ''),
                memo,
                category: getCategory(o['商品'], o['交易对方']),
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
    console.log(homebankRecords);
    return homebankRecords;
};

qif.writeToFile(
    { cash: transferWeixinFile() },
    './qif/weixin-homebank.qif',
    () => {}
);
