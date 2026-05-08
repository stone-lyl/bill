import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { validCategories } from "../private/categories.mjs";
import Bottleneck from "bottleneck";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.resolve(rootDir, ".env.local") });

// Get API key and URL from environment variables
const API_KEY = process.env.DEEPSEEK_API_KEY;
const API_BASE_URL = process.env.DEEPSEEK_API_URL;

// Create the model
const model = new ChatOpenAI({
  modelName: "deepseek-v4-flash",
  openAIApiKey: API_KEY,
  temperature: 0.1,
  maxTokens: 500,
  timeout: 10000,
  configuration: {
    baseURL: API_BASE_URL,
  },
});

// Bottleneck limiter: limits concurrency and minimal interval between starts
const limiter = new Bottleneck({
  maxConcurrent: Number(process.env.AI_LIMIT_CONCURRENCY || 2),
  minTime: Number(process.env.AI_LIMIT_MIN_INTERVAL || 250),
});

// Wrap model.invoke with limiter
const limitedInvoke = (prompt) => limiter.schedule(() => model.invoke(prompt));

/**
 * Predicts the category of a transaction using LangChain with DeepSeek V3 model
 * @param {string} tradePartner - The trade partner
 * @param {string} commodity - The commodity or description
 * @returns {Promise<string>} - The predicted category
 */
export async function predictCategory(tradePartner, commodity) {
  try {
    if (!API_KEY || !API_BASE_URL) {
      console.warn(
        "DeepSeek API key or URL not found in environment variables"
      );
      return null;
    }

    // Create a prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
请通过交易对方和商品名称，预测交易的类别，
预测的范围越小越好，如一项物品既可以是 '买菜和水果', 也可以是 '餐饮',还可以是 '购物', 那请预测 '买菜和水果'。
交易对方: ${tradePartner}
商品名称: ${commodity}
可选类别: ${validCategories.join(", ")}

只需回复一个最合适的类别名称，不要包含其他内容。
        `);

    // Format the prompt with the input values
    const prompt = await promptTemplate.format({
      tradePartner: tradePartner || "无",
      commodity: commodity || "无",
      categories: validCategories.join(", "),
    });

    // Call the model with rate limiting to avoid overwhelming the API/service
    const response = await limitedInvoke(prompt);

    // Extract the category from the response
    const category = response.content.trim();

    if (validCategories.includes(category)) {
      return category;
    } else {
      console.warn(`Unexpected category returned by AI: ${category}`);
      return null;
    }
  } catch (error) {
    console.error("Error predicting category with AI:", error);
    return null;
  }
}
