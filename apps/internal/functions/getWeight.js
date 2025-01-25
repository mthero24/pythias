import axios from "axios"
export async function getWeight({url}){
    let res = await axios.get(url)
    console.log(res.data)
    if(res.data.code == 100){
        return {error: true, msg: res.data.message}
    }else{
        return {error: false, ...res.data}
    }  
}