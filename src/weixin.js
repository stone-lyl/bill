const csv = require('csv');
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const path = require('path');

const fs = require('fs');

const { parse: parseDate, format } = require('date-fns');

let fileStr = fs.readFileSync(
    path.resolve(__dirname, '../csv/微信支付账单.csv'),
    {
        encoding: 'utf8',
    }
);

fileStr = fileStr.slice(fileStr.indexOf('交易时间'));
const fileArr = parse(fileStr, {
    columns: true,
    skip_empty_lines: true,
});

const getWXCategory = (o) => {
    const commodity = o['商品'];
    if (commodity.includes('车')) {
        return '出行交通';
    } else if (commodity.includes('转账备注') || commodity === '/') {
        return '人情往来';
    } else {
        return '餐饮';
    }
};

const transferWeixinFile = () => {
    const homebankRecords = fileArr
        .filter((o) => {
            return o['交易对方'] !== '理财通';
        })
        .map((o, index) => {
            const isOutcome = o['收/支'] === '支出';
            let memo = `${o['交易类型']} - ${o['商品']}`;
            if (o['备注'] !== '/') {
                memo += '：' + o['备注'];
            }
            return {
                amount: o['金额(元)'].replace('¥', isOutcome ? '-' : ''),
                memo,
                category: getWXCategory(o),
                payment: 0,
                payee: o['交易对方'],
                date: format(
                    new Date(o['交易时间'].substring(0, 10)),
                    'd/M/yyyy'
                ),
                info: '',
                tags: '',
            };
        });
    console.log(homebankRecords);
    return homebankRecords;
};
var qif = require('qif');

qif.writeToFile(
    { cash: transferWeixinFile() },
    './qif/weixin-homebank.qif',
    () => {}
);
