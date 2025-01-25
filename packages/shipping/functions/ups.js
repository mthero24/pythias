import axios from "axios"
async function auth() {
    if(new Date(Date.now()) > new Date(getNew)){
      const formData = {
          grant_type: 'client_credentials'
      };

      const resp = await fetch(
      `https://onlinetools.ups.com/security/v1/oauth/token`,
      {
          method: 'POST',
          headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-merchant-id': 'H5500V',
          Authorization: 'Basic ' + Buffer.from(`${process.env.UPSClientID}:${process.env.UPSClientSecret}`).toString('base64')
          },
          body: new URLSearchParams(formData).toString()
      }
      );

      const data = await resp.json();
      if(data.response) console.log(data.response);
      getNew = new Date(Date.now() + (parseInt(data.expires_in) * 1000))
      access_token = data.access_token
      return access_token
    }else{
      return access_token
    }
}

export async function GetPrice(
  {order,
  service,
  description,
  packageType,
  packageDescription,
  weight}
) {
  console.log(order.user.addresses);
  console.log(process.env.UPSAccountNumber);
  const query = new URLSearchParams({
    additionalinfo: "string",
  }).toString();
  let body = {
    RateRequest: {
      Request: {
        RequestOption: "Rate",
        SubVersion: 2205,
        TransactionReference: {
          CustomerContext: order.poNumber,
        },
      },
      PickupType: {
        Code: "01",
        Description: "Daily Pickup",
      },
      CustomerClassification: {
        Code: "00",
        Description: "Rates Associated with Shipper Number",
      },
      Shipment: {
        Shipper: {
          Name: "Print Oracle",
          ShipperNumber: process.env.UPSAccountNumber,
          Address: {
            AddressLine: ["21440 Melrose Ave."],
            City: "Southfield",
            StateProvinceCode: "MI",
            PostalCode: "48446",
            CountryCode: "US",
          },
        },
        ShipTo: {
          Name: order.shippingAddress.name,
          Address: {
            AddressLine: [
              order.shippingAddress.address1,
              order.shippingAddress.address2,
            ],
            City: order.shippingAddress.city,
            StateProvinceCode: order.shippingAddress.state,
            PostalCode: order.shippingAddress.zip,
            CountryCode: order.shippingAddress.country,
          },
        },
        ShipFrom: {
          Name: order.user.addresses[0].name,
          Address: {
            AddressLine: [
              order.user.addresses[0].address1,
              order.user.addresses[0].address2,
            ],
            City: order.user.addresses[0].city,
            StateProvinceCode: order.user.addresses[0].state,
            PostalCode: order.user.addresses[0].zip,
            CountryCode: order.user.addresses[0].country,
          },
        },
        PaymentDetails: {
          ShipmentCharge: {
            Type: "01",
            BillShipper: {
              AccountNumber: process.env.UPSAccountNumber,
            },
          },
        },
        Service: {
          Code: service,
          Description: description,
        },
        NumOfPieces: "1",
        Package: {
          PackagingType: {
            Code: packageType,
            Description: packageDescription,
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: "LBS",
              Description: "Pounds",
            },
            Weight: weight.toString(),
          },
        },
      },
    },
  };
  const version = "v2205";
  const requestoption = "Rate";
  let authorizeToken = await auth();
  const resp = await fetch(
    `https://onlinetools.ups.com/api/rating/${version}/Rate?`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        transId: "string",
        transactionSrc: "testing",
        Authorization: `Bearer ${authorizeToken}`,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await resp.json();
  if (data.response) {
    console.log(data.response);
    return 5000;
  } else {
    console.log(data.RateResponse.RatedShipment.TotalCharges.MonetaryValue);
    return data.RateResponse.RatedShipment.TotalCharges.MonetaryValue;
  }
}
