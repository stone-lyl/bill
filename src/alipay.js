const csv = require('csv');
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');

const fs = require('fs');

const { parse: parseDate, format } = require('date-fns');

let fileStr = fs.readFileSync(
    path.resolve(__dirname, '../alipay_record_20210530_2331_1.csv'),
    {
        encoding: 'utf8',
    }
);

fileStr = fileStr.slice(
    fileStr.indexOf('-\r\n') + 3,
    fileStr.lastIndexOf('\r\n-')
);

const fileArr = parse(fileStr, {
    columns: true,
    skip_empty_lines: true,
});

const getAlipayCategory = (o) => {
    const tradePatner = o['交易对方'];
    const commodity = o['商品名称'];
    if (commodity === undefined || tradePatner === undefined) {
        console.log(o);
    }
    if (commodity.includes('车') || tradePatner.includes('车')) {
        return '出行交通';
    } else if (commodity === '手机充值') {
        return '话费';
    } else if (o['交易来源地'] === '淘宝') {
        return '购物';
    } else if (commodity.includes('相互宝') || commodity.includes('保')) {
        return '保险';
    } else {
        return '餐饮';
    }
};

const transferAlipayFile = () => {
    const newFile = fileArr.map((o) => {
        console.log(o, 'ooooo');
        let newObj = {};
        for (const [key, value] of Object.entries(o)) {
            newObj[`${key.trim()}`] = value.trim();
        }
        return newObj;
    });
    const filterRecords = newFile.filter((o) => {
        return (
            o['交易对方'] !== '天弘基金管理有限公司' &&
            o['交易状态'] !== '交易关闭'
        );
    });

    const homebankRecords = filterRecords.map((o) => {
        const isOutcome = o['收/支'] === '支出';
        let memo = `${o['交易对方']} - ${o['商品名称']}`;
        return {
            amount: (isOutcome ? '-' : '') + o['金额（元）'],
            memo,
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
    return homebankRecords;
};

var qif = require('qif');

qif.writeToFile(
    { cash: transferAlipayFile() },
    './alipay-homebank.qif',
    () => {}
);
