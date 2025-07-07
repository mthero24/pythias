import TikTokAuth from "@/models/tiktok"

export default async function Test(){
    console.log("test ++++++++++++++++++++++++")
    let tikToks = await TikTokAuth.find({})
    console.log(tikToks)
    return <h1>Something</h1>
}