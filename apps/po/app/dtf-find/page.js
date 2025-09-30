import { Button } from "@repo/ui/button";
import {setConfig, DTFFind} from "@pythias/dtf";
setConfig({
    active: true,
    account: "dsafdasdfsadfdfsa"
})

export default async function DtfFind(req, res){
    return <DTFFind/>
}