import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWeixinAmount } from '../src/weixin-amount.mjs';

test('formats unsigned expense amounts as negative', () => {
    assert.equal(formatWeixinAmount('9', '支出'), '-9');
});

test('keeps unsigned income amounts positive', () => {
    assert.equal(formatWeixinAmount('35.14', '收入'), '35.14');
});

test('defaults unsigned amounts to expense when direction is missing', () => {
    assert.equal(formatWeixinAmount('56', ''), '-56');
});

test('supports amounts with a yuan symbol', () => {
    assert.equal(formatWeixinAmount('¥13.9', '支出'), '-13.9');
});
