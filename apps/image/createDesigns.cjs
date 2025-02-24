const csv=require('csvtojson')
const fs = require("fs")
csv()
.fromFile("./upc2.csv")
.then((jsonObj)=>{
    console.log(jsonObj);
    let skus =[]
    jsonObj = jsonObj.map(d=>{
        let sku = d.SKU
        let upc = d["GTIN-12"]
        if(upc) {
            skus.push({sku, upc})
        }
    })
    fs.writeFile("./rest.json", JSON.stringify(skus), "utf8", (err)=>{
        if(err) console.log(err)
    })
})