const express = require("express");
let fs = require("fs");
const sharp = require("sharp");
const bodyParser = require("body-parser")
const app = express()


app.use(
    bodyParser.urlencoded({
        limit: "1000000gb",
        parameterLimit: 1000000000000,
        extended: true,
    })
)
app.use(bodyParser.json({ limit: "1000000gb" }));

app.post("/", async (req,res)=>{
    console.log(req.body)
    try{
        for(let f of req.body.files){
            if(f.type == "png" || f.type == "jpg"){
                const buffer = Buffer.from(f.buffer, "binary");
                let image = sharp(buffer)
                let trimmedBase64 = await image.png({ quality: 100 }).toBuffer();
                trimmedBase64 = trimmedBase64.toString("base64")
                fs.writeFile(`hotfolder/${req.body.sku}.png`, trimmedBase64, "base64", (err) => {
                    if (err) console.log(err);
                  });
            }
        }
    }catch(e){
        console.log(e)
    }
    res.send({error: false, msg: "file written"})
})

app.listen(3500, async function () {
    console.log("writer listening on port 3500");
});