
import {getRates} from "@pythias/shipping";

export default async function POST(req= NextApiRequest){
    // let rates = await getRates({
    //     address: {
    //         name: "michael thero",
    //         address1: "1421 hidden view dr",
    //         city: "lapeer",
    //         state: "MI",
    //         zip: "48446",
    //         country: "US"
    //     },
    //     businessAddress: JSON.parse(process.env.businessAddress),
    //     type: "Standard",
    //     providers: ["usps", "fedex"],
    //     weight: 7.9,
    //     dimensions: {width: 8, height: 1, length: 10 },
    //     enSettings: {
    //     requesterID: process.env.endiciaRequesterID,
    //     accountNumber: process.env.endiciaAccountNUmber,
    //     passPhrase: process.env.endiciaPassPhrase,
    //     },
    //     credentials: {
    //     clientId: process.env.uspsClientId,
    //     clientSecret: process.env.uspsClientSecret,
    //     accountNumber: process.env.accountNumber
    //     },
    //     credentialsFedEx: {
    //     accountNumber: process.env.tpalfedexaccountnumber,
    //     meterNumber: process.env.tpalfedexmeternumber,
    //     key: process.env.tpalfedexkey,
    //     password: process.env.tpalfedexpassword,
    //     },
    //     credentialsFedExNew: {
    //     accountNumber: process.env.AccountFedExTest,
    //     key: process.env.ApiKeyTestFedEx,
    //     secret: process.env.SecretKeyFedExTest,
    //     },
    //     credentialsUPS: {
    //     accountNumber: process.env.UPSAccountNumber,
    //     clientID: process.env.UPSClientID,
    //     clientSecret: process.env.UPSClientSecret,
    //     },
    // });
    // console.log(rates)
    return <h1>Test</h1>
}