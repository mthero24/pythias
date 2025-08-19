import Order from "@/models/Order";
import {Main}from "./Main";

export default async function Page(){
    console.log("Clockwise page accessed");
    return (
        <Main orders={{}}/>
    )
}