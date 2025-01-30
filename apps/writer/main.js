const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
let fs = require("fs");
const sharp = require("sharp");
const bodyParser = require("body-parser")
const express = require('express');
const publicDirectoryPath = path.join(__dirname, 'public');
let lastFileWritten = "Waiting for file to write"
exp = express();
exp.set('view engine', 'ejs');
exp.set('views', __dirname + '/views/');
exp.use(express.static(process.cwd() + '/views'));
exp.use(express.static(publicDirectoryPath));
exp.use(
    bodyParser.urlencoded({
        limit: "1000000gb",
        parameterLimit: 1000000000000,
        extended: true,
    })
)
exp.use(bodyParser.json({ limit: "1000000gb" }));
exp.get('/', function(req, res) {
    res.render('index', {lastFileWritten});
});
exp.post("/", async (req,res)=>{
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
exp.post("/roq", (req, res)=>{
    let content = `${req.body.barcode};${req.body.barcode}-label.zpl;;;;;${req.body.quantity};;;${req.body.pause};${req.body.QuantityToStack};${req.body.Recipe};${req.body.sleeves};${req.body.body};${req.body.exit}`
    try{
        fs.writeFile(`./hotfolder/${req.body.barcode}.csv`, content, (err)=>{
            if(err) console.log(err)
        })
        fs.writeFile(`./hotfolder/${req.body.barcode}-label.zpl`, req.body.label? req.body.label: "no label", (err)=>{
            if(err) console.log(err)
        })
        //waiting.push({id:req.body.barcode, exit: req.body.exit})
        //if(!monitorRunning) monitor("dummy.csv", req.body.barcode)
        res.send({code: 200, msg: "files written"})
    }catch(e){
        console.log(e)
        res.send({code: 400, msg: e})
    }
})
exp.listen(3500, async function () {
    console.log("writer listening on port 3500");
});
function createWindow () {
    const win = new BrowserWindow({
      width: 600,
      height: 180,
      ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    })
  
    win.loadFile('index.html')
    console.log("loaded window")
  }
  
  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })