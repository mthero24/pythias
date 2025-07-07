import TikTokAuth from "@/models/tiktok"
export const dynamic = "force-dynamic"; 
export default async function Test(){
     console.log("test ++++++++++++++++++++++++");
    try{
        console.log("test ++++++++++++++++++++++++")
        let tikToks = await TikTokAuth.find({}).catch(e=>{console.log(e)})
        console.log(tikToks)
    }catch(e){
        console.log(e)
    }
    return <h1>Something</h1>
}