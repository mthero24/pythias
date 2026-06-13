export const serialize = (data) => {
    if (typeof data === 'object') return JSON.parse(JSON.stringify(data));
    else return data;
};
