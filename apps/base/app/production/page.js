import {getRates} from "@pythias/shipping";


export default async function Test(){
    let rates = await getRates({
        address: {
            zip: "48446",
            country: "US"
        },
        businessAddress:{
            postalCode: "48075"
        },
        type: "standard",
        providers: ["usps"],
        weight: 10,
        enSettings: {
            requesterID: process.env.endiciaRequesterID,
            accountNumber: process.env.endiciaAccountNUmber,
            passPhrase: process.env.endiciaPassPhrase
        },
        credentials: {clientId: process.env.uspsClientId, clientSecret: process.env.uspsClientSecret,}
    })
    console.log(rates)
    return <h1>Getting Rates</h1>
}