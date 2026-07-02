import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAlipayAmount } from '../src/alipay-amount.mjs';

test('formats Alipay neutral merchant payments as expenses', () => {
    assert.equal(
        formatAlipayAmount('100.36', '不计收支', {
            productName: '&ldquo;百元裤&rdquo;No.2  锦纶直筒休闲工装凉感透气速干长裤【三无公社】',
            fundStatus: '',
        }),
        '-100.36'
    );
});

test('keeps explicit Alipay income amounts positive', () => {
    assert.equal(formatAlipayAmount('45.00', '收入'), '45.00');
});

test('keeps Alipay refund records positive when direction is neutral', () => {
    assert.equal(
        formatAlipayAmount('12.00', '不计收支', {
            productName: '退款-火车票',
            fundStatus: '',
            transactionStatus: '退款成功',
        }),
        '12.00'
    );
});
