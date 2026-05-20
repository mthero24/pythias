export const isSingleItem = (item) => {
    if (item.order.items.filter(i => !i.canceled && !i.shipped).length > 1) return false;
    return true;
};

export const isShipped = async (item) => {
    return item.order.items.filter(i => !i.canceled && !i.shipped).length === 0;
};

export const canceled = (item, order) => {
    return item.canceled === true || order.canceled === true;
};
