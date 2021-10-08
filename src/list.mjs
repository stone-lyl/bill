export const alipayList = new Map();
alipayList.set('车', '交通出行');
alipayList.set('出行', '交通出行');
alipayList.set('手机充值', '话费');
alipayList.set('相互宝', '保险');
alipayList.set('保', '保险');
alipayList.set('菜鸟', '杂项');
alipayList.set('快递', '杂项');
alipayList.set('旅', '旅游');
alipayList.set('门票', '旅游');
alipayList.set('爱心', '捐赠');
alipayList.set('克松', '交通出行');
alipayList.set('地铁', '交通出行');
alipayList.set('朱涛', '生活费');
alipayList.set('超市', '购物');
alipayList.set('转账备注', '人情来往');
alipayList.set('/', '人情来往');
alipayList.set('default', '餐饮');

export const filterList = ['基金', '银行', '花呗', '还款', '红包', '理财通'];

export const filterUnusedRecords = (tradePatner, commodity) => {
    const result = filterList.filter((filter) =>
        `${tradePatner}-${commodity}`.includes(filter)
    );
    return result.length === 0;
};

const keywords = Array.from(alipayList.keys());

/**
 *
 * @param tradePatner 商品对象
 * @param commodity 商品名称
 * @returns string 类型
 */
export const getCategory = (tradePatner, commodity) => {
    if (commodity === undefined || tradePatner === undefined) {
        console.warn(commodity, tradePatner, '该交易美元名称和对象!!!');
        return 'error';
    }

    const matched = keywords.find((keyword) =>
        `${tradePatner} - ${commodity}`.includes(keyword)
    );
    return alipayList.get(matched) || '餐饮';
};
