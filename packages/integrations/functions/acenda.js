import axios from "axios"
export const getTokenAcenda = async ({clientId, clientSecret})=>{
    let headers = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    let  urlencoded = new URLSearchParams();
    urlencoded.append("client_id", clientId);
    urlencoded.append("client_secret", clientSecret);
    urlencoded.append("grant_type", "client_credentials");
   // console.log(urlencoded)
    let errorRes
    let res = await axios.post("https://login.acenda.io/auth/realms/acenda/protocol/openid-connect/token", urlencoded, headers).catch(e=> {errorRes = e.response?.data; console.log(e.response)})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.access_token
    }
}

export const getWarehouseAcenda = async ({clientId, clientSecret, organization}) =>{
    let token = await getTokenAcenda({clientId, clientSecret})
    console.log(token , "token")
    let headers = {
        headers: {
            "X-Astur-Organization": organization,
            AUTHORIZATION: `Bearer ${token}`
        }
    }
    let errorRes
    let res = await axios.get("https://api.acenda.io/v1/warehouse", headers).catch(e=> {errorRes = e.response?.data; console.log(e.response)})
    console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.results
    }
}
export const addInventoryAcenda = async ({clientId, clientSecret, organization, inventory}) =>{
    //console.log(inventory, "inventory")
    let token = await getTokenAcenda({clientId, clientSecret})
    //console.log(token , "token")
    let headers = {
        headers: {
            "X-Astur-Organization": organization,
            AUTHORIZATION: `Bearer ${token}`
        }
    }
    let errorRes
    let res = await axios.post("https://api.acenda.io/v1/inventory_detail/bulk", inventory, headers).catch(e=> {errorRes = e.response?.data; console.log(e.response)})
   // console.log(errorRes, res?.data.result)
    if(errorRes) console.log("error +++++++++++++++")
    if(errorRes){
        return null
    }else{
        return res?.data.results
    }
}
export const getCatalogAcenda = async ({clientId, clientSecret, organization}) =>{
    let token = await getTokenAcenda({clientId, clientSecret})
    //console.log(token , "token")
    let headers = {
        headers: {
            "X-Astur-Organization": organization,
            AUTHORIZATION: `Bearer ${token}`
        }
    }
    let errorRes
    let res = await axios.get("https://api.acenda.io/v1/catalog", headers).catch(e=> {errorRes = e.response?.data; console.log(e.response)})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.result
    }
}
export const getShipAdviceAcenda = async ({ clientId, clientSecret, organization, unacked = true, limit = 50, offset = 0 }) => {
    const token = await getTokenAcenda({ clientId, clientSecret });
    if (!token) return { error: "Auth failed" };
    const headers = { "X-Astur-Organization": organization, AUTHORIZATION: `Bearer ${token}` };
    const params = { limit, offset };
    if (unacked) params.unacked = true;
    let errorRes;
    const res = await axios.get("https://api.acenda.io/v1/ship_advice", { params, headers }).catch(e => { errorRes = e.response?.data ?? e.message; });
    if (errorRes) return { error: errorRes };
    return { orders: res?.data?.results ?? [], total: res?.data?.total ?? 0 };
};

export const acknowledgeShipAdviceAcenda = async ({ clientId, clientSecret, organization, id }) => {
    const token = await getTokenAcenda({ clientId, clientSecret });
    if (!token) return { error: "Auth failed" };
    const headers = { "X-Astur-Organization": organization, AUTHORIZATION: `Bearer ${token}` };
    let errorRes;
    const res = await axios.post(`https://api.acenda.io/v1/ship_advice/${id}/acknowledge`, {}, { headers }).catch(e => { errorRes = e.response?.data ?? e.message; });
    if (errorRes) return { error: errorRes };
    return { success: true, data: res?.data };
};

export const getSkuAcenda = async ({clientId, clientSecret, organization, sku}) =>{
    let token = await getTokenAcenda({clientId, clientSecret})
    //console.log(token , "token")
    let headers = {
        headers: {
            "X-Astur-Organization": organization,
            AUTHORIZATION: `Bearer ${token}`
        }
    }
    let errorRes
    let res = await axios.get(`https://api.acenda.io/v1/catalog?query={"sku":"${sku}"}`, headers).catch(e=> {errorRes = e.response?.data})
    //console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.result
    }
}

export const fulfillShipAdviceAcenda = async ({ clientId, clientSecret, organization, id, carrier, trackingNumber }) => {
    const token = await getTokenAcenda({ clientId, clientSecret });
    if (!token) return { error: "Auth failed" };
    const headers = { "X-Astur-Organization": organization, AUTHORIZATION: `Bearer ${token}` };
    let errorRes;
    const res = await axios.post(
        `https://api.acenda.io/v1/ship_advice/${id}/fulfill`,
        { carrier, tracking_number: trackingNumber },
        { headers }
    ).catch(e => { errorRes = e.response?.data ?? e.message; });
    if (errorRes) return { error: errorRes };
    return { success: true, data: res?.data };
};

export const getSalesChannelsAcenda = async ({ clientId, clientSecret, organization }) => {
    const token = await getTokenAcenda({ clientId, clientSecret });
    if (!token) return { error: "Auth failed" };
    const headers = { "X-Astur-Organization": organization, AUTHORIZATION: `Bearer ${token}` };
    let errorRes;
    const res = await axios.get("https://api.acenda.io/v1/sales_channel", { headers }).catch(e => { errorRes = e.response?.data ?? e.message; });
    if (errorRes) return { channels: [] };
    return { channels: res?.data?.results ?? res?.data?.result ?? [] };
};

export const getInventoryDetailAcenda = async ({ clientId, clientSecret, organization, limit = 50, offset = 0 }) => {
    const token = await getTokenAcenda({ clientId, clientSecret });
    if (!token) return { error: "Auth failed" };
    const headers = { "X-Astur-Organization": organization, AUTHORIZATION: `Bearer ${token}` };
    let errorRes;
    const res = await axios.get("https://api.acenda.io/v1/inventory_detail", { params: { limit, offset }, headers }).catch(e => { errorRes = e.response?.data ?? e.message; });
    if (errorRes) return { error: errorRes };
    return { inventory: res?.data?.results ?? [], total: res?.data?.total ?? 0 };
};