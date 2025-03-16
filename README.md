# 账单转换器 (Bill Converter)

一个将支付宝、微信导出的 CSV 账单转换为记账软件 HomeBank 可识别的 QIF 文件的工具。

## 功能特点

- 支持支付宝账单导出文件的转换
- 支持微信支付账单导出文件的转换
- 智能交易分类（基于 AI 和规则匹配）
- 自动过滤不需要记录的交易
- 支持 GBK 编码的 CSV 文件解析
- 生成 HomeBank 兼容的 QIF 格式文件

## 系统要求

- Node.js (v14.0.0 或更高版本)
- npm 或 yarn 包管理器

## 安装

克隆仓库并安装依赖：

```bash
git clone https://github.com/stone-lyl/bill.git
cd bill
npm install
# 或使用 yarn
yarn install
```

## 环境配置

创建 `.env.local` 文件并配置 AI 分类所需的 API 密钥（可选）：

```
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=your_api_url_here
```

如果不配置 API 密钥，系统将回退到基于规则的分类方法。

## 使用方法

### 准备账单文件

1. 从支付宝导出 CSV 格式的账单，并将其保存为 `csv/alipay.csv`
2. 从微信支付导出 CSV 格式的账单，并将其保存为 `csv/微信支付账单.csv`

### 转换支付宝账单

```bash
npm run alipay
# 或使用 yarn
yarn alipay
```

转换后的文件将保存为 `qif/alipay-homebank.qif`

### 转换微信账单

```bash
npm run weixin
# 或使用 yarn
yarn weixin
```

转换后的文件将保存为 `qif/weixin-homebank.qif`

## 自定义分类规则

可以通过修改 `src/category-config.mjs` 文件来自定义交易分类规则。该文件定义了关键词到分类的映射关系。

## 项目结构

```
bill/
├── csv/                   # 存放导出的 CSV 账单文件
├── qif/                   # 存放生成的 QIF 文件
├── src/
│   ├── ai-category.mjs    # AI 分类功能
│   ├── alipay.mjs         # 支付宝账单处理
│   ├── category-config.mjs # 分类规则配置
│   ├── list.mjs           # 分类处理逻辑
│   └── weixin.mjs         # 微信账单处理
├── .env.local             # 环境变量配置
└── package.json           # 项目依赖和脚本
```

## 分类系统

账单转换器使用混合分类系统：

1. **基于规则的分类**：使用预定义的关键词匹配规则
2. **AI 辅助分类**：当规则无法匹配时，使用 AI 模型进行智能分类
3. **特殊情况处理**：针对特定商家或交易类型的自定义规则

支持的分类包括：餐饮、购物、交通出行、话费、保险、杂项、旅游、捐赠、生活费、人情来往（支出）、娱乐、个人护理、生活用品、电子产品、人情收入（收入）、学习（书籍，订阅服务）、运动等。

## 注意事项

- 确保 CSV 文件使用正确的编码格式（支付宝通常为 GBK，微信为 UTF-8）
- 转换前请备份原始账单文件
- 首次使用时建议检查转换结果是否符合预期

## 许可证

ISC

## 作者

stone
