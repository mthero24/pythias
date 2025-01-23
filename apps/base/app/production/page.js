import {getRates} from "@pythias/shipping";


export default async function Test(){
    let rates = await getRates({
      address: {
        name: "Michael thero",
        address1: "1421 hidden view dr",
        address2: "",
        city: "Lapeer",
        state: "MI",
        zip: "48446",
        country: "US",
      },
      businessAddress: {
        name: "Tee Shirt Palce",
        companyName: "Print Oracle",
        addressLine1: "21440 Melrose Ave.",
        addressLin1: "",
        city: "southfield",
        state: "MI",
        postalCode: "48075",
        country: "US",
      },
      type: "next day",
      providers: ["endicia", "fedex"],
      weight: 10,
      enSettings: {
        requesterID: process.env.endiciaRequesterID,
        accountNumber: process.env.endiciaAccountNUmber,
        passPhrase: process.env.endiciaPassPhrase,
      },
      credentials: {
        accountNumber: process.env.uspsClientId,
        clientSecret: process.env.uspsClientSecret,
      },
      credentialsFedEx: {
        accountNumber: process.env.tpalfedexaccountnumber,
        meterNumber: process.env.tpalfedexmeternumber,
        key: process.env.tpalfedexkey,
        password: process.env.tpalfedexpassword,
      },
      credentialsFedExNew: {
        accountNumber: process.env.AccountFedExTest,
        key: process.env.ApiKeyTestFedEx,
        secret: process.env.SecretKeyFedExTest,
      },
      credentialsUPS: {
        accountNumber: process.env.UPSAccountNumber,
        clientID: process.env.UPSClientID,
        clientSecret: process.env.UPSClientSecret,
      },
    });
    console.log(rates)
    return <h1>Getting Rates</h1>
}