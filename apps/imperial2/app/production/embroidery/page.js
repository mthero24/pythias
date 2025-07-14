import {Main} from "@pythias/embroidery"
import {Box, Card} from "@mui/material"
export default async function Embroidery(){
    return (
        <Main printers={["printer1", "printer2"]} />
    )
}