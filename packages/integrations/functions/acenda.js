import axios from "axios"
export const getTokenAcenda = async ({clientId, clientSecret})=>{
    let header = {
        header: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }
    let  urlencoded = new URLSearchParams();
    urlencoded.append("client_id", clientId);
    urlencoded.append("client_secret", clientSecret);
    urlencoded.append("grant_type", "client_credentials");
    console.log(urlencoded)
    let errorRes
    let res = await axios.post("https://login.acenda.io/auth/realms/acenda/protocol/openid-connect/token", urlencoded, header).catch(e=> {errorRes = e.response.data})
    console.log(errorRes, res?.data)
    if(errorRes){
        return null
    }else{
        return res?.data
    }
}