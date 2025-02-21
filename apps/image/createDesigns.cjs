const csv=require('csvtojson')
const fs = require("fs")
csv()
.fromFile("./rest.csv")
.then((jsonObj)=>{
    console.log(jsonObj);
    let skus ={}
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
        try{
            if(!skus[newSku]){
                skus[newSku] = {}
                skus[newSku][d.SKU.split("_")[0]] = {}
                skus[newSku][d.SKU.split("_")[0]].colors = [d.SKU.split("_")[1]]
            }else{
                if(!skus[newSku][d.SKU.split("_")[0]]) {
                    skus[newSku][d.SKU.split("_")[0]] = {}
                    skus[newSku][d.SKU.split("_")[0]].colors = [d.SKU.split("_")[1]]
                }
                else skus[newSku][d.SKU.split("_")[0]].colors.push(d.SKU.split("_")[1])
            }
            //console.log(skus)
        }catch(e){
            console.log(e)
        }
    })
    fs.writeFile("./rest.json", JSON.stringify(skus), "utf8", (err)=>{
        if(err) console.log(err)
    })
})