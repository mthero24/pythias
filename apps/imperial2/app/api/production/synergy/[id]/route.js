import {Items, Temps, Color, Blank as Style} from "@pythias/mongo";
import { createImage } from "@/functions/image";
import { NextApiRequest, NextResponse, useParams } from "next/server";

const getimagesize = async (options) => {
  let http = require("https");
  var sizeOf = require("image-size");
  try {
    return new Promise((resolve) => {
      http.get(options, function (response) {
        var chunks = [];
        response
          .on("data", function (chunk) {
            chunks.push(chunk);
          })
          .on("end", function () {
            var buffer = Buffer.concat(chunks);
            console.log(sizeOf(buffer));
            resolve(sizeOf(buffer));
          });
      });
    });
  } catch (err) {
    console.log(err);
    return { height: 2500, width: 3000 };
  }
};
export async function GET(request, { params }) {
    let par = await params
    let item = await Items.findOne({ pieceId: par.id })
    item.color = await Color.findOne({_id: item.color}).select("name category color_type hexcode image")
    item.styleV2 = await Style.findOne({ code: item.styleCode });
    console.log(item.styleV2.envleopes);
    let envleopes = item.styleV2.envleopes.filter(
        (envelope) => envelope.sizeName == item.sizeName || envelope.size == item.size.toString()
    );
    console.log(envleopes, "fff");
    let pretreatments = item.styleV2.pretreatments.filter(
        (pre) => pre.type == item.color.color_type
    );
    //console.log(item.color)
    let firefly;
    for (let fly of item.styleV2.firefly) {
        console.log(fly.type == item.color.color_type);
        if (fly.type == item.color.color_type) firefly = fly;
    }
    let envelope = envleopes[0];
    console.log(envelope);
    let pretreatment = pretreatments[0];
    console.log(item.design);
    let demenstions = await getimagesize(
        (item.frontTreated == false && item.design?.front != undefined) ||
        item.design.back == undefined
        ? item.design?.front.replace(
            "https://s3.wasabisys.com/teeshirtpalace-node-dev",
            "https://images2.teeshirtpalace.com"
            )
        : item.design.back.replace(
            "https://s3.wasabisys.com/teeshirtpalace-node-dev",
            "https://images2.teeshirtpalace.com"
            )
    );
    console.log(demenstions, "dementions");
    let height = (envelope.height / 3500) * demenstions.height - 0.5;
    console.log("height", height);
    if (
        height >
        (envelope.platen == 0
        ? 21
        : envelope.platen == 1
            ? 18
            : envelope.platen == 2
            ? 16
            : envelope.platen == 3
                ? 12
                : 8)
    )
        height = envelope.height - 0.5;
    let width = envelope.width - 0.2;
    if (
        width >
        (envelope.platen == 0
        ? 16
        : envelope.platen == 1
            ? 16
            : envelope.platen == 2
            ? 14
            : envelope.platen == 3
                ? 10
                : 7)
    )
        width = envelope.width - 0.2 + 1;
    // let wholeheight = envelope.platen == 0 ? 21 : envelope.platen == 1 ? 18 : envelope.platen == 2 ? 16 : envelope.platen == 3 ? 12 : 8
    // let wholewidth = envelope.platen == 0 ? 18 : envelope.platen == 1 ? 18 : envelope.platen == 2 ? 18 : envelope.platen == 3 ? 12 : 7
    let area = 220;
    console.log((pretreatment.density / area).toFixed(3), "density");
    console.log("******************");
    let bulbs = ``;
    for (let i = 1; i <= 54; i++) {
        bulbs = `${bulbs}
                                <a:double>${firefly.bulbs[`bulb${i}`]}</a:double>
                            `;
    }
    let temps = await Temps.findOne({});
    // let temps = {
    //     light: {
    //         temp: 320,
    //         time: 50
    //     },
    //     dark: {
    //         temp: 360,
    //         time: 60
    //     }
    // }
   
    await tracking.save();
    let pressTime;
    let pressTemp;
    let printedTemp;
    let printedTime;
    if (item.color.name.toLowerCase() == "ash") {
        firefly.cureTemp = temps.ash.temp;
        firefly.cureTime = temps.ash.time;
        pressTime = temps.pressAsh.time;
        pressTemp = temps.pressAsh.temp;
        printedTime = temps.printedAsh.time;
        printedTemp = temps.printedAsh.temp;
    } else if (item.color.color_type.toLowerCase() == "light") {
        firefly.cureTemp = temps.light.temp;
        firefly.cureTime = temps.light.time;
        pressTime = temps.pressLight.time;
        pressTemp = temps.pressLight.temp;
        printedTime = temps.printedLight.time;
        printedTemp = temps.printedLight.temp;
    } else {
        firefly.cureTemp = temps.dark.temp;
        firefly.cureTime = temps.dark.time;
        pressTime = temps.pressDark.time;
        pressTemp = temps.pressDark.temp;
        printedTime = temps.printedDark.time;
        printedTemp = temps.printedDark.temp;
    }
    let INKCOMBO = [
        "ColorInkOnly",
        "WhiteInkOnly",
        "ColorAndWhiteInk",
        "BlackInkOnly",
    ];
    let Profile = {
        inkCombination: 2, // 0:color only 1:white ink only 2:color+white ink 3:black ink only
        resolution: 1, // 1 only
        saturation: 10, // 0-40
        brightness: 5, // 0-40
        contrast: 10, // 0-40
        unidirectional: false, // true or false
        ecomode: false, // true or false
        blackBackground: false, // true or false
        minWhite: 1, // 1-6
        Choke: 2, // 0-10
        whiteColorPause: false, // true or false
        whiteColorPauseSpan: 0, // 0-60
        highlight: 5, // 1-9
        mask: 3, // 1-5
        transparent: false, // true or false
        LayerWhite2: false, // true or false
        inkVolume: 10, // 1-10
        doublePrint: 2, // 0-3
        multiple: false, //true or false
        cyanBalance: 0, //-5 to 5
        MagentaBalance: 0, //-5 to 5
        YellowBalance: 0, //-5 to 5
        blackBalance: 0, //-5 to 5
    };
    if (item.styleV2.code == "WRT") item.color.category == "Standard";
    console.log(item.color);
    if (
        item.color.name.toLowerCase() == "white" ||
        (item.color.category == "2 tone" && item.styleV2.code != "EZ145")
    )
        Profile.inkCombination = 0;
    else if (item.color.name == "ash") {
        Profile.saturation = 5;
        Profile.brightness = 0;
        Profile.contrast = 5;
        Profile.highlight = 4;
        Profile.mask = 3;
    } else {
        console.log(item.styleV2.profiles);
        if (item.color.color_type == "dark") {
        for (let pro of item.styleV2.profiles) {
            if (pro.type == "dark") {
            Profile.highlight = pro.highlight + 1;
            // Profile.mask = pro.mask + 1;
            }
        }
        } else {
        for (let pro of item.styleV2.profiles) {
            if (pro.type == "light") {
            Profile.highlight = pro.highlight + 1;
            // Profile.mask = pro.mask + 1;
            }
        }
        }
        if (item.color.name == "red" || item.color.name == "orange")
        Profile.highlight + 1;
    }
    await tracking.save();
    console.log(firefly);
    //set material thickness by style
    let xml = `<?xml version="1.0" encoding="utf-16"?>
                        <ProductInfo xmlns="http://schemas.datacontract.org/2004/07/LoadZoneAPI" 
                                xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
                        <ActiveImageLocation>FRONT</ActiveImageLocation>
                        ${
                        item.canceled
                            ? `<Alert>true</Alert>`
                            : `<Alert i:nil="true"/>`
                        }
                        <Art>
                            <ArtInfo>
                                <Angle i:nil="true"/>
                                <ArtFile>
                                    <APIKey i:nil="true"/>
                                    <APISecret i:nil="true"/>
                                    <BucketName i:nil="true"/>
                                    <FolderID i:nil="true"/>
                                    <RegionName i:nil="true"/>
                                    <ServerType>LOCAL</ServerType>
                                    <Uri>${
                                    (item.frontTreated == false &&
                                        item.design?.front != undefined) ||
                                    item.design.back == undefined
                                        ? item.design?.front
                                            .replace(/&/g, "&amp;")
                                            .replace(
                                            "https://s3.wasabisys.com/teeshirtpalace-node-dev",
                                            "https://images2.thirtpalace.com"
                                            ).replace(
                                            "https://s3.wasabisys.com/images2.tshirtpalace.com",
                                            "https://images2.teeshirtpalace.com"
                                            )
                                        : item.design.back.replace(/&/g, "&amp;")
                                    }</Uri>
                                </ArtFile>
                                <CropToImage>false</CropToImage>
                                <FinishedQuantity>1</FinishedQuantity>
                                <Height>${height.toFixed(2)}</Height>
                                <HorizontalOffset>0</HorizontalOffset>
                                <ImageHorizontalAlignment i:nil="true"/>
                                <ImageScaleMethod>FIT_ART_TO_ENVELOPE</ImageScaleMethod>
                                <ImageVerticalAlignment>CENTER</ImageVerticalAlignment>
                                <Location>${
                                (item.frontTreated == false &&
                                    item.design?.front != undefined) ||
                                item.design.back == undefined
                                    ? "FRONT"
                                    : "BACK"
                                }</Location>
                                <LocationDisplayColor i:nil="true"/>
                                <ManualImageScale i:nil="true"/>
                                <Pretreat>
                                    <Enabled>true</Enabled>
                                    <FluidName>Fluid1</FluidName>
                                    <Passes>1</Passes>
                                    <SprayDensity>${(
                                    pretreatment.density / area
                                    ).toFixed(3)}</SprayDensity>
                                    <TrackingID i:nil="true"/>
                                </Pretreat>
                                <PretreatCure>
                                    <BottomFanPower>0</BottomFanPower>
                                    <BulbPowers i:nil="true"
                                    xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>
                                    <CoolerPower>${firefly.cooler}</CoolerPower>
                                    <Enabled>true</Enabled>
                                    <ExhaustPower>0</ExhaustPower>
                                    <Temperature>${(
                                    ((firefly.cureTemp - 32) * 5) /
                                    9
                                    ).toFixed(2)}</Temperature>
                                    <Time>${firefly.cureTime}</Time>
                                    <TopFanPower>0</TopFanPower>
                                    <TrackingID i:nil="true"/>
                                </PretreatCure>
                                <PretreatPress>
                                    <Enabled>true</Enabled>
                                    <Pressure>40</Pressure>
                                    <Temperature>${(
                                    ((pressTemp - 32) * 5) /
                                    9
                                    ).toFixed(2)}</Temperature>
                                    <Time>${
                                    item.styleV2.code == "AS" ||
                                    item.styleV2.code == "AFTH"
                                        ? 15
                                        : pressTime
                                    }</Time>
                                    <TrackingID i:nil="true"/>
                                </PretreatPress>
                                <Print>
                                    <CMYKInt>
                                        <BlackBalance>${
                                        Profile.blackBalance
                                        }</BlackBalance>
                                        <CyanBalance>${
                                        Profile.cyanBalance
                                        }</CyanBalance>
                                        <MagentaBalance>${
                                        Profile.MagentaBalance
                                        }</MagentaBalance>
                                        <YellowBalance>${
                                        Profile.YellowBalance
                                        }</YellowBalance>
                                    </CMYKInt>
                                    <ChokeWidthInt>${Profile.Choke}</ChokeWidthInt>
                                    <ColorInkVolumeInt>${
                                    Profile.inkVolume
                                    }</ColorInkVolumeInt>
                                    <ColorMultiPass>${
                                    Profile.multiple
                                    }</ColorMultiPass>
                                    <ColorProcessingInt>
                                        <Brightness>${
                                        Profile.brightness
                                        }</Brightness>
                                        <Contrast>${Profile.contrast}</Contrast>
                                        <Saturation>${
                                        Profile.saturation
                                        }</Saturation>
                                    </ColorProcessingInt>
                                    <DoublePassDelayInt>0</DoublePassDelayInt>
                                    <Enabled>true</Enabled>
                                    <InkCombination>${
                                    INKCOMBO[Profile.inkCombination]
                                    }</InkCombination>
                                    <MaterialThicknessInt>${
                                    item.styleV2.code == "AS"
                                        ? 2
                                        : item.styleV2.code == "AFTH"
                                        ? 3
                                        : 1
                                    }</MaterialThicknessInt>
                                    <MinimumWhiteBaseInt>0</MinimumWhiteBaseInt>
                                    <OmitBlack>false</OmitBlack>
                                    <OmitWhite>false</OmitWhite>
                                    <PrintFile i:nil="true"/>
                                    <PrintResolutionInt>${
                                    Profile.resolution
                                    }</PrintResolutionInt>
                                    <PrintTimeTicks>300000000</PrintTimeTicks>
                                    <TransparentColors>
                                        <ColorValue>
                                            <Value>4292613180</Value>
                                        </ColorValue>
                                    </TransparentColors>
                                    <TransparentToleranceInt>0</TransparentToleranceInt>
                                    <TwoLayerWhiteDelayTicks>0</TwoLayerWhiteDelayTicks>
                                    <UnidirectionalPrinting>${
                                    Profile.unidirectional
                                    }</UnidirectionalPrinting>
                                    <UseDoublePass>true</UseDoublePass>
                                    <DoublePassDelayInt>2</DoublePassDelayInt>
                                    <UseTransparentColors>${
                                    Profile.transparent
                                    }</UseTransparentColors>
                                    <UseTwoLayerWhite>${
                                    Profile.LayerWhite2
                                    }</UseTwoLayerWhite>
                                    <UseWhiteColorDelay>${
                                    Profile.whiteColorPause
                                    }</UseWhiteColorDelay>
                                    <WhiteColorDelayTicks>${
                                    Profile.whiteColorPauseSpan
                                    }</WhiteColorDelayTicks>
                                    <WhiteHighlightInt>${
                                    Profile.highlight
                                    }</WhiteHighlightInt>
                                    <WhiteMaskInt>${Profile.mask}</WhiteMaskInt>
                                </Print>
                                <PrintCure>
                                    <BottomFanPower>0</BottomFanPower>
                                    <BulbPowers i:nil="true"
                                    xmlns:a="http://schemas.microsoft.com/2003/10/Serialization/Arrays"/>
                                    <CoolerPower>${firefly.cooler}</CoolerPower>
                                    <Enabled>true</Enabled>
                                    <ExhaustPower>0</ExhaustPower>
                                    <Temperature>${(
                                    ((printedTemp - 32) * 5) /
                                    9
                                    ).toFixed(2)}</Temperature>
                                    <Time>${printedTime}</Time>
                                    <TopFanPower>0</TopFanPower>
                                    <TrackingID i:nil="true"/>
                                </PrintCure>
                                <PrintPress i:nil="true"/>
                                <Processed>false</Processed>
                                <Thumbnail>
                                    <APIKey i:nil="true"/>
                                    <APISecret i:nil="true"/>
                                    <BucketName i:nil="true"/>
                                    <FolderID i:nil="true"/>
                                    <RegionName i:nil="true"/>
                                    <ServerType>LOCAL</ServerType>
                                    <Uri>${
                                    (item.frontTreated == false &&
                                        item.design?.front != undefined) ||
                                    item.design.back == undefined
                                        ? `${createImage(
                                            item.color.name,
                                            item.styleV2.code,
                                            { url: item.design?.front }
                                        ).replace(/&/g, "&amp;")}`
                                        : `${createImage(
                                            item.color.name,
                                            item.styleV2.code,
                                            { url: item.design.back }
                                        ).replace(/&/g, "&amp;")}`
                                    }</Uri>
                                </Thumbnail>
                                <TotalQuantity>1</TotalQuantity>
                                <TrackingID i:nil="true"/>
                                
                                <VerticalOffset>${0.5}</VerticalOffset>
                                <Width>${width}</Width>     
                            </ArtInfo>
                        </Art>
                        <Color>${item.color.name}</Color>
                        <DateOrdered i:nil="true"/>
                        <Description>${item.sku}</Description>
                        <FinishedQuantity>0</FinishedQuantity>
                        ${
                        item.canceled == true
                            ? `<Notes>Canceled</Notes>`
                            : "<Notes></Notes>"
                        }
                        <OrderID>${item.order}</OrderID>
                        <ProductID>${item.pieceId}</ProductID>
                        <SKU>${item.sku}</SKU>
                        <Size>${item.sizeName}</Size>
                        <Source i:nil="true"/>
                        <Style>${item.styleV2.code}</Style>
                        <TotalQuantity>1</TotalQuantity>
                        <Type>Cotton</Type>
                        <Source/>
                        ${
                        item.canceled == true
                            ? `<tags>canceled</tags>`
                            : "<Tags/>"
                        }
                        <Version>1</Version>
                    </ProductInfo>
                `;
    console.log(xml);
    item.treatedDate = new Date();
    item.printedDate = new Date();
    item.treated = true;
    item.printed = true;
    item.frontTreated = item.frontTreated ? false : true;
    item.backTreated =
        item.frontTreated == false &&
        item.design?.front != undefined &&
        item.design.back != undefined
        ? true
        : false;
    item.lastScan = {
        station: "Treatment Machine",
        date: new Date(Date.now()),
    };
    if (!item.steps) item.steps = [];
    item.steps.push({
        status: "Treatment Machine",
        date: new Date(),
    });
    await item.save();
    return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}