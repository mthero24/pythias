import {setConfig, DTFSend} from "@pythias/dtf";

setConfig(process.env.dtf)


export default async function dtfSend(){
    return <DTFSend printers={["printer1"]}/>
}