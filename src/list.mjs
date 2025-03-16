import { getCombinedCategoryMap, filterList } from './category-config.mjs';
import { predictCategory } from './ai-category.mjs';

// Get the combined category map (default + private)
export const alipayList = getCombinedCategoryMap();

export const filterUnusedRecords = (tradePatner, commodity) => {
    const result = filterList.filter((filter) =>
        `${tradePatner}-${commodity}`.includes(filter)
    );
    return result.length === 0;
};

const keywords = Array.from(alipayList.keys());

/**
 * Gets the category for a transaction using rule-based matching
 * @param {string} tradePatner - The trade partner
 * @param {string} commodity - The commodity or description
 * @returns {string} The matched category
 */
const getRuleBasedCategory = (tradePatner, commodity) => {
    if (commodity === undefined || tradePatner === undefined) {
        console.warn(commodity, tradePatner, '该交易没有名称和对象!!!');
        return 'error';
    }

    const matched = keywords.find((keyword) =>
        `${tradePatner} - ${commodity}`.includes(keyword)
    );
    return alipayList.get(matched) || '其他';
};

/**
 * Gets the category for a transaction, using AI if available, falling back to rule-based matching
 * @param {string} tradePatner - The trade partner
 * @param {string} commodity - The commodity or description
 * @returns {Promise<string>} The category
 */
export const getCategory = async (tradePatner, commodity) => {
    const result = getRuleBasedCategory(tradePatner, commodity);
    if (result === '其他') {
        try {
            // Try to get category using AI
            const aiCategory = await predictCategory(tradePatner, commodity);

            // If AI returned a valid category, use it
            if (aiCategory) {
                console.log(`AI categorized "${tradePatner} - ${commodity}" as "${aiCategory}"`);
                return aiCategory;
            }
        } catch (error) {
            console.error('Error using AI for category prediction:', error);
        }
    }

    return result;
};
