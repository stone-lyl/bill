import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.resolve(rootDir, '.env.local') });

// Get API key and URL from environment variables
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_BASE_URL = process.env.DEEPSEEK_API_URL;

/**
 * Predicts the category of a transaction using LangChain with DeepSeek V3 model
 * @param {string} tradePartner - The trade partner
 * @param {string} commodity - The commodity or description
 * @returns {Promise<string>} - The predicted category
 */
export async function predictCategory(tradePartner, commodity) {
    try {
        if (!API_KEY || !API_BASE_URL) {
            console.warn('DeepSeek API key or URL not found in environment variables');
            return null;
        }

        // Validate the category is one of the expected values
        const validCategories = [
            '餐饮', '购物', '交通出行', '话费', '保险',
            '杂项', '旅游', '捐赠', '生活费', '人情来往（支出）', '娱乐', '个人护理',
            '生活用品', '电子产品', '人情收入（收入）', '学习（书籍，订阅服务）', '运动'
        ];

        // Create a prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
请将以下交易信息分类到最合适的一个类别中:
交易对方: {tradePartner}
商品名称: {commodity}

可选类别: {categories}

只需回复一个最合适的类别名称，不要包含其他内容。
        `);

        // Create the model
        const model = new ChatOpenAI({
            modelName: "deepseek-chat",
            openAIApiKey: API_KEY,
            temperature: 0.1,
            maxTokens: 80,
            configuration: {
                baseURL: API_BASE_URL,
            },
        });

        // Format the prompt with the input values
        const prompt = await promptTemplate.format({
            tradePartner: tradePartner || '无',
            commodity: commodity || '无',
            categories: validCategories.join(', ')
        });

        // Call the model
        const response = await model.invoke(prompt);

        // Extract the category from the response
        const category = response.content.trim();

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
