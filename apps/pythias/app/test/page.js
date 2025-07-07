import TikTokAuth from "@/models/tiktok"

export default async function Test(){
    try{
        console.log("test ++++++++++++++++++++++++")
        let tikToks = await TikTokAuth.find({}).catch(e=>{console.log(e)})
        console.log(tikToks)
    }catch(e){
        console.log(e)
    }
    return <h1>Something</h1>
}