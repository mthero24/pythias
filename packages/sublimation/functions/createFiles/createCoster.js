import sharp from "sharp";
let PDFDocument = require("pdfkit");
const createCoster = async (url, bgColor, sku, index = 0) => {
  console.log(url, bgColor);
  let offsetTop = 0;
  let margin = 1.4;
  const heightInches = 4.2;
  const widthInches = 4.2;
  const MARGIN = margin;
  const WIDTH = (heightInches * 1000) / 2;
  const HEIGHT = (widthInches * 1000) / 2;
  
  let bg;
  if (typeof colors[bgColor.toLowerCase()] == "string") {
    bg = await new Jimp(WIDTH, HEIGHT, colors[bgColor.toLowerCase()]);
  } else {
    bg = await Jimp.read(colors[bgColor.toLowerCase()].url);
    bg = await bg.resize(WIDTH, HEIGHT);
  }
  bg = bg.rotate(90);
  let front = await Jimp.read(
    url.replace(
      "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev",
      "https://images2.teeshirtpalacec.com"
    )
  );
  front = await front.autocrop({ cropOnlyFrames: false }).rotate(90);
  let ratio = bg.getWidth() / bg.getHeight();
  let designRatio = front.getWidth() / front.getHeight();

  if (ratio > designRatio) {
    await front.resize(Jimp.AUTO, HEIGHT / MARGIN);
  } else {
    await front.resize(WIDTH / MARGIN, Jimp.AUTO);
  }

  await front.resize(front.getWidth(), front.getHeight());

  let centerX = WIDTH / 2;
  let frontCenterX = front.getWidth() / 2;
  let x = centerX - frontCenterX + (offsetTop * 1000) / 2;

  let y = HEIGHT / 2 - front.getHeight() / 2;

  bg = await bg
    .quality(60)
    .composite(front, x, HEIGHT - front.getHeight() - y)
    .mirror(true, false)
    .getBase64Async(Jimp.AUTO);
  return bg;
};
const createMousePad = async (url, bgColor, sku) => {
  const MARGIN = 1.15;
  const WIDTH = 2401;
  const HEIGHT = 2851;
  const MAX_STRETCH = 1.0;
  const DESIRED_HEIGHT = WIDTH / MARGIN;
  let colors = {
    navy: "#030B5D",
    brown: "#4E3200",
    black: "#000000",
    aqua: "#02C6E8",
    orange: "#FF6401",
    blue: "#0723E4",
    purple: "#6001B5",
    charcoal: "#585858",
    maroon: "#870200",
    military: "#4B5320",
    green: "#10A048",
    red: "#E40702",
    "light purple": "AA86C5",
    sand: "#D2CEB0",
    pink: "#FFAAE7",
    skyblue: "#71D8EB",
    yellow: "#FFFD02",
    limegreen: "#00F759",
    forest: "#083C18",
    hotpink: "#DF01CE",
    gold: "#FEBB1C",
    white: "#FFFFFF",
    silver: "#CCCCCC",
    camo: {
      url: "https://images2.teeshirtpalace.com/catalog/msp/camo-msp-swatch.jpg",
    },
    tiedye: {
      url: "https://images2.teeshirtpalace.com/catalog/msp/tiedye-msp-swatch.jpg",
    },
  };

  let bg;
  if (typeof colors[bgColor.toLowerCase()] == "string") {
    bg = await new Jimp(WIDTH, HEIGHT, colors[bgColor.toLowerCase()]);
  } else {
    bg = await Jimp.read(colors[bgColor.toLowerCase()].url);
    bg = await bg.resize(WIDTH, HEIGHT);
  }
  let front = await Jimp.read(
    url.replace(
      "https://s3.us-east-1.wasabisys.com/teeshirtpalace-node-dev",
      "https://images2.teeshirtpalacec.com"
    )
  );
  front = await front.autocrop({ cropOnlyFrames: false }).rotate(90);
  let ratio = bg.getWidth() / bg.getHeight();
  let designRatio = front.getWidth() / front.getHeight();

  if (ratio > designRatio) {
    await front.resize(Jimp.AUTO, HEIGHT / MARGIN);
  } else {
    await front.resize(WIDTH / MARGIN, Jimp.AUTO);
  }

  //stretch
  let stretch = DESIRED_HEIGHT / front.getHeight();
  if (stretch > MAX_STRETCH) {
    stretch = MAX_STRETCH;
  }
  await front.resize(front.getWidth(), front.getHeight() * stretch);

  let centerX = WIDTH / 2;
  let frontCenterX = front.getWidth() / 2;
  let x = centerX - frontCenterX;

  let y = HEIGHT / 2 - front.getHeight() / 2;

  bg = await bg
    .composite(front, x, HEIGHT - front.getHeight() - y)
    .mirror(true, false)
    .getBase64Async(Jimp.AUTO);
  return bg;
};
export const makeMouseCosterFiles = async () => {
  if (toDoMousePadsCoasters.length >= 2) {
    let image1;
    let image2;
    if (toDoMousePadsCoasters[0].code == "MSP") {
      image1 = await createMousePad(
        toDoMousePadsCoasters[0].url,
        toDoMousePadsCoasters[0].bgColor,
        toDoMousePadsCoasters[0].sku
      );
    } else {
      image1 = await createCoster(
        toDoMousePadsCoasters[0].url,
        toDoMousePadsCoasters[0].bgColor,
        toDoMousePadsCoasters[0].index,
        toDoMousePadsCoasters[0].sku
      );
    }
    if (toDoMousePadsCoasters[1].code == "MSP") {
      image2 = await createMousePad(
        toDoMousePadsCoasters[1].url,
        toDoMousePadsCoasters[1].bgColor,
        toDoMousePadsCoasters[1].sku
      );
    } else {
      image2 = await createCoster(
        toDoMousePadsCoasters[1].url,
        toDoMousePadsCoasters[1].bgColor,
        toDoMousePadsCoasters[1].index,
        toDoMousePadsCoasters[1].sku
      );
    }
    let doc = new PDFDocument({ size: [24 * 72, 12 * 72] });
    doc.pipe(fs.createWriteStream(`epsonhotno/MSPCOAST${Date.now()}.pdf`));
    doc
      .font(__dirname + "/public/fonts/LibreBarcode39-Regular.ttf")
      .fontSize(30)
      .text(`*${toDoMousePadsCoasters[0].sku}*`, 5, 0);
    doc
      .font("Times-Roman")
      .fontSize(10)
      .text(
        `${toDoMousePadsCoasters[0].sku} ${toDoMousePadsCoasters[0].code} ${toDoMousePadsCoasters[0].shipping} ${toDoMousePadsCoasters[0].qty}`,
        7,
        35
      );
    doc
      .font(__dirname + "/public/fonts/LibreBarcode39-Regular.ttf")
      .fontSize(30)
      .text(`*${toDoMousePadsCoasters[1].sku}*`, 8 * 72 + 20, 0);
    doc
      .font("Times-Roman")
      .fontSize(10)
      .text(
        `${toDoMousePadsCoasters[0].sku} ${toDoMousePadsCoasters[1].code} ${toDoMousePadsCoasters[1].shipping} ${toDoMousePadsCoasters[1].qty}`,
        8 * 72 + 20,
        35
      );
    doc.image(image1, 0, 72, { width: 8 * 72, height: 11.5 * 72 });
    doc.image(image2, 8 * 72 + 20, 72, { width: 8.25 * 72, height: 11 * 72 });
    doc.end();
    toDoMousePadsCoasters.shift();
    toDoMousePadsCoasters.shift();
  }
};