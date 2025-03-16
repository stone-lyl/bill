import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get API key and URL from environment variables
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_URL = process.env.DEEPSEEK_API_URL;

/**
 * Predicts the category of a transaction using DeepSeek V3 model
 * @param {string} tradePartner - The trade partner
 * @param {string} commodity - The commodity or description
 * @returns {Promise<string>} - The predicted category
 */
export async function predictCategory(tradePartner, commodity) {
    try {
        if (!API_KEY || !API_URL) {
            console.warn('DeepSeek API key or URL not found in environment variables');
            return null;
        }

        // Validate the category is one of the expected values
        const validCategories = [
            '餐饮', '购物', '交通出行', '话费', '保险',
            '杂项', '旅游', '捐赠', '生活费', '人情来往（支出）', '娱乐', '个人护理',
            '生活用品', '电子产品', '人情收入（收入）', '学习（书籍，订阅服务）', '运动'
        ];
        const prompt = `
    请将以下交易信息分类到最合适的一个类别中:
    交易对方: ${tradePartner || '无'}
    商品名称: ${commodity || '无'}
    
    可选类别: ${validCategories.join(', ')}
    
    只需回复一个最合适的类别名称，不要包含其他内容。
    `;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-v3',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 20
            })
        });

        if (!response.ok) {
            console.warn(`API request failed with status: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const category = data.choices[0].message.content.trim();


        if (validCategories.includes(category)) {
            return category;
        } else {
            console.warn(`Unexpected category returned by AI: ${category}`);
            return null;
        }
    } catch (error) {
        console.error('Error predicting category with AI:', error);
        return null;
    }
}
