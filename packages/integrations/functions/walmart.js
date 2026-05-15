import axios from "axios"

const getTokenWalmart = async ({clientId, clientSecret, partnerId})=>{
    //console.log(clientId, clientSecret)
    let headers={
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        },
        auth: {
            username: clientId,
            password:clientSecret
        }
    }
    //console.log(headers)
    let body= {
        grant_type: "client_credentials",
    }
    let errorRes
    let res = await axios.post("https://marketplace.walmartapis.com/v3/token", body, headers).catch(e=> {errorRes = e.response.data})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.access_token
    }
} 

export const getItemsWalmart = async ({clientId, clientSecret, partnerId, params})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    //console.log(token, "token")
    let searchParams = ``
    if(params){
        for(let par of params){
            if(searchParams.length > 0){
                searchParams = `${searchParams}&${Object.keys(par)[0]}=${par[Object.keys(par)[0]]}`
            }else{
                searchParams = `${Object.keys(par)[0]}=${par[Object.keys(par)[0]]}`
            }
        }
    }
    console.log(searchParams)
    let headers={
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }
    let errorRes
    let res = await axios.get(`https://marketplace.walmartapis.com/v3/items?${searchParams}`, headers).catch(e=> {errorRes = e.response.data})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.ItemResponse
    }
}
export const retireItemWalmart = async ({clientId, clientSecret, partnerId, sku})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    //console.log(token, "token")
    let headers={
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }
    let errorRes
    let res = await axios.delete(`https://marketplace.walmartapis.com/v3/items/${sku}`, headers).catch(e=> {errorRes = e.response.data})
    console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.ItemResponse
    }
}

export const bulkUploadWalmart = async ({clientId, clientSecret, partnerId, type, payload})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    const jsonBuffer = Buffer.from(JSON.stringify(payload))
    const boundary = `----WalmartBoundary${Date.now()}`
    const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="items.json"\r\nContent-Type: application/json\r\n\r\n`),
        jsonBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`)
    ])
    let errorRes
    let res = await axios.post(`https://marketplace.walmartapis.com/v3/feeds?feedType=${type}`, body, {
        headers: {
            Accept: "application/json",
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }).catch(e=> {errorRes = e.response?.data ?? e.message})
    if(errorRes) return { error: errorRes }
    return { feedId: res?.data.feedId }
}
export const getSpecWalmart = async ({clientId, clientSecret, partnerId, type})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    console.log(token, "token")
    let headers={
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }
    let body = {
        "feedType": "MP_WFS_ITEM",
        "version": "5.0.20240517-04_08_27-api",
        "productTypes": [
           type
        ]
    }
    let errorRes
    let res = await axios.post(`https://marketplace.walmartapis.com/v3/items/spec`, body, headers).catch(e=> {errorRes = e.response.data})
    console.log(errorRes, res?.data, res?.data?.schema.properties.MPItem.items.properties.Visible.properties[type])
    // console.log(res.data.schema, "++++++++++++ schema ++++++")
    // console.log(res.data.schema.properties, "++++++++++++ properties ++++++")
    // console.log(res.data.schema.properties.MPItem.items.properties, "++++++++++++ properties ++++++")
    let thisOne = Object.keys(res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].properties).map(v=>{
        return {property: v, type: res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].properties[v].type, enum: res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].properties[v].enum, properties: res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].properties[v].properties, items: res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].properties[v].items, examples: res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].properties[v].examples}
    })
    console.log(thisOne)
    let write = {required: res?.data?.schema.properties.MPItem.items.properties.Visible.properties["T-Shirts"].required, all: thisOne }
    // fs.writeFile("walmart_t-shirts", JSON.stringify(write), "utf-8", (err)=>{
    //     if(err) console.log(err)
    // })
    if(errorRes){
        return null
    }else{
        return res?.data.feedId
    }
}
export const getFeedWalmart = async ({clientId, clientSecret, partnerId, feedId})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    let errorRes
    let res = await axios.get(`https://marketplace.walmartapis.com/v3/feeds?feedId=${feedId}`, {
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }).catch(e=> {errorRes = e.response?.data ?? e.message})
    if(errorRes) return { error: errorRes }
    return res?.data
}

export const getOrdersWalmart = async ({clientId, clientSecret, partnerId, createdStartDate, limit = 200, nextCursor})=>{
    let token = await getTokenWalmart({clientId, clientSecret, partnerId})
    if(!token) return { error: "Failed to get Walmart token" }
    const params = new URLSearchParams({ limit })
    if(createdStartDate) params.set("createdStartDate", createdStartDate)
    if(nextCursor) params.set("nextCursor", nextCursor)
    let errorRes
    let res = await axios.get(`https://marketplace.walmartapis.com/v3/orders?${params}`, {
        headers: {
            Accept: "application/json",
            "WM_SEC.ACCESS_TOKEN": token,
            "WM_PARTNER.ID": partnerId,
            "WM_SVC.NAME": "pythias",
            "WM_QOS.CORRELATION_ID": "pythias",
            "WM_CONSUMER.CHANNEL.TYPE": "some-channel"
        }
    }).catch(e=> {errorRes = e.response?.data ?? e.message})
    if(errorRes) return { error: errorRes }
    const list = res?.data?.list
    const orders = list?.elements?.order ?? []
    const nextCursorOut = list?.meta?.nextCursor ?? null
    return { orders, nextCursor: nextCursorOut }
}
