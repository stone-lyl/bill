const EXPLICIT_POSITIVE_SIGN_PATTERN = /^\+/;
const COLLECTION_PATTERN = /收款/;
const REFUND_PATTERN = /退款/;

/**
 * Formats an Alipay amount for QIF output.
 * Alipay may mark card-funded merchant purchases as "不计收支", so only explicit
 * income or collection records stay positive.
 * @param {string | number} amount
 * @param {string} direction
 * @param {{ productName?: string, fundStatus?: string, transactionStatus?: string }} context
 * @returns {string}
 */
export const formatAlipayAmount = (
    amount,
    direction,
    { productName = '', fundStatus = '', transactionStatus = '' } = {}
) => {
    const normalized = `${amount ?? ''}`.trim();

    if (!normalized) {
        return '';
    }

    if (normalized.startsWith('-')) {
        return normalized;
    }

    const unsignedAmount = normalized.replace(EXPLICIT_POSITIVE_SIGN_PATTERN, '');
    const isIncome =
        direction === '收入' ||
        fundStatus === '已收入' ||
        transactionStatus === '退款成功' ||
        REFUND_PATTERN.test(productName) ||
        COLLECTION_PATTERN.test(productName);

    return `${isIncome ? '' : '-'}${unsignedAmount}`;
};
