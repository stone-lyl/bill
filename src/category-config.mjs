import { personalCategories } from '../private/categories.mjs';

/**
 * Configuration file for category mappings
 * This file contains mappings for transaction categories
 */

// Default category mappings that don't contain sensitive information
export const defaultCategoryMap = new Map([
    ['车', '交通出行'],
    ['出行', '交通出行'],
    ['手机充值', '话费'],
    ['相互宝', '保险'],
    ['保', '保险'],
    ['菜鸟', '杂项'],
    ['快递', '杂项'],
    ['旅', '旅游'],
    ['门票', '旅游'],
    ['爱心', '捐赠'],
    ['地铁', '交通出行'],
    ['超市', '购物'],
    ['转账备注', '人情来往'],
]);

// Load private category mappings from a private categories file
export const loadPrivateCategoryMap = () => {
    try {
        const privateCategories = new Map();
        personalCategories.forEach((value, key) => {
            privateCategories.set(key, value);
        });

        return privateCategories;
    } catch (error) {
        console.warn('Failed to load private category mappings:', error.message);
    }

    // Return empty map if file doesn't exist or there's an error
    return new Map();
};

// Combine default and private mappings
export const getCombinedCategoryMap = () => {
    const combinedMap = new Map([...defaultCategoryMap]);
    const privateMap = loadPrivateCategoryMap();

    // Add private mappings to the combined map
    for (const [key, value] of privateMap.entries()) {
        combinedMap.set(key, value);
    }

    return combinedMap;
};

// Filter list for transactions to be excluded
export const filterList = ['基金', '银行', '花呗', '还款', '红包', '理财通', '钉钉群收款', '十分爱心', '余额宝', '零钱'];
