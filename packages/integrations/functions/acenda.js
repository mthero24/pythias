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
    console.log(token , "token")
    let headers = {
        headers: {
            "X-Astur-Organization": organization,
            AUTHORIZATION: `Bearer ${token}`
        }
    }
    let errorRes
    let res = await axios.post("https://api.acenda.io/v1/inventory_detail/bulk", inventory, headers).catch(e=> {errorRes = e.response?.data; console.log(e.response)})
    console.log(errorRes, res?.data.result)
    if(errorRes) console.log("error +++++++++++++++")
    if(errorRes){
        return null
    }else{
        return res?.data.results
    }
}
export const getCatalogAcenda = async ({clientId, clientSecret, organization}) =>{
    let token = await getTokenAcenda({clientId, clientSecret})
    console.log(token , "token")
    let headers = {
        headers: {
            "X-Astur-Organization": organization,
            AUTHORIZATION: `Bearer ${token}`
        }
    }
    let errorRes
    let res = await axios.get("https://api.acenda.io/v1/catalog", headers).catch(e=> {errorRes = e.response?.data; console.log(e.response)})
    console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data.result
    }
}
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