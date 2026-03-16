const CURRENCY_SYMBOL_PATTERN = /^[¥￥]/;
const EXPLICIT_POSITIVE_SIGN_PATTERN = /^\+/;

/**
 * Formats a WeChat amount for QIF output.
 * If the amount has no explicit sign, direction controls the sign.
 * Unknown direction defaults to expense to match the existing workflow.
 * @param {string | number} amount
 * @param {string} direction
 * @returns {string}
 */
export const formatWeixinAmount = (amount, direction) => {
    const normalized = `${amount ?? ''}`.trim().replace(CURRENCY_SYMBOL_PATTERN, '');

    if (!normalized) {
        return '';
    }

    if (normalized.startsWith('-')) {
        return normalized;
    }

    const unsignedAmount = normalized.replace(EXPLICIT_POSITIVE_SIGN_PATTERN, '');
    const isIncome = direction === '收入';
    const isExpense = direction === '支出' || !isIncome;

    return `${isExpense ? '-' : ''}${unsignedAmount}`;
};
