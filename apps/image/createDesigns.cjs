const csv=require('csvtojson')
const fs = require("fs")
csv()
.fromFile("./rest.csv")
.then((jsonObj)=>{
    console.log(jsonObj);
    let skus = []
    let designs = []
    jsonObj = jsonObj.map(d=>{
        let sku = d.SKU.split("_")
        sku = sku.splice(3)
        //console.log(sku)
        let newSku = ""
        for( let part of sku){
            newSku = `${newSku}_${part}`
        }
        newSku = newSku.replace("_", "")
        //console.log(newSku)
        if(!skus.includes(newSku)){
            skus.push(newSku)
            designs.push({title: d.Title?.split("|")[0].trim(), sku: newSku})
        }
    })
    console.log(designs.length)
    fs.writeFile("./rest.json", JSON.stringify(designs), "utf8", (err)=>{
        if(err) console.log(err)
    })
})