import Order from "@/models/Order";
import {Main}from "./Main";

export default async function Page(){
    console.log("Clockwise Page Render")

    return (
        <Main orders={{}}/>
    )
}