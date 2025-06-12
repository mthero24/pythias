import {setConfig, DTFSend} from "@pythias/dtf";

setConfig(process.env.dtf)


export default async function dtfSend(){
    //console.log(JSON.parse(process.env.dtf))
    return <DTFSend printers={JSON.parse(process.env.dtf).printers}/>
}