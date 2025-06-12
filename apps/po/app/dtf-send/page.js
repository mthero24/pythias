import {setConfig, DTFSend} from "@pythias/dtf";

setConfig(process.env.dtf)


export default async function dtfSend(){
    //sp,.
    return <DTFSend printers={JSON.parse(process.env.dtf).printers}/>
}