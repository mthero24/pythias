export const serialize = (data) => {
    //console.log(data)
    if(typeof data === 'object') return JSON.parse(JSON.stringify(data));
    else return data
}
