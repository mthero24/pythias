const csv=require('csvtojson')
const fs = require("fs")
csv()
.fromFile("./master.csv")
.then((jsonObj)=>{
    console.log(jsonObj.length);
    let t2n =[]
    jsonObj = jsonObj.map(d=>{
        //console.log(d.Title, d["Screen #"])
        t2n.push({title: d.Title, sku: d["Screen #"]})
    })
    fs.writeFile("./t2n.json", JSON.stringify(t2n), "utf8", (err)=>{
        if(err) console.log(err)
    })
})