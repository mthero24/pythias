import Order from "@/models/Order";
import Item from "@/models/Items";
import Inventory from "@/models/inventory"
import Batch from "@/models/batches";
import axios from "axios";
import btoa from "btoa";
import {NextApiResponse, NextResponse} from "next/server";
let letters = [
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
];
let DTF = [
  "TAS",
  "THD",
  "TDHD",
  "YHD",
  "AFTH",
  "YAS",
  "LSS",
  "TLT",
  "LTB",
  "DSB",
  "SS",
  "AS",
  "APON",
  "TSS",
  "TJB",
  "YPWH",
  "DNAH",
  "FBTH",
  "OFTH",
  "KLCB",
  "CKBL",
  "YPKCB",
  "PURB",
  "SPTB",
  "BGCB",
  "BPWB",
  "CTWCB",
  "RBGCB",
  "NEBGD",
  "BGSCP",
  "ZTB",
  "OGDT",
  "CTCBP",
  "FM",
  "THPC",
  "AHH",
  "BLCTH",
  "CTKHS",
  "WRHD",
  "TCTKHS",
  "TDCH",
  "EZ602",
];

const printLabels = async (labelSort) => {
  let labels = ``;
  for (let l of labelSort) {
    labels += l.label;
  }
  let headers = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer $2a$10$PDlV9Xhf.lMicHvMvBCMwuyCYUhWGqjaCEFpG0AJMSKteUfKBO.Hy`
        }
    }
    console.log(headers)
    let res = await axios.post(`http://${process.env.localIP}/api/print-labels`, {label: btoa(labels), printer: "printer1"}, headers).catch(e=>{console.log(e.response)})
    console.log(res?.data)
    res.data.status = 200
  return res.data;
};

const markLabelsPrinted = async (labelSort, opts = {}) => {
  let { batchID, printedOn, type } = opts;
  let updated = 0;
  for (let label of labelSort) {
    try {
      let item = await Item.findOne({ _id: label.id }).populate(
        "order styleV2 size color"
      );
      item.labelPrinted = true;
      item.labelPrintedDates.push(printedOn);
      item.labelLastPrinted = printedOn;
      if (type != "reprint") {
        item.batchID = batchID;
      }
      item.status = "label Printed";
      if (!item.steps) item.steps = [];
      item.steps.push({
        status: `label Printed`,
        date: new Date(),
      });
      if (item.order) {
        item.order.status = "Processing";
        item.order.save();
      }
      if (type != "reprint") {
        let inventory = await Inventory.findOne({
          color_name: item.color.name,
          size_name: item.sizeName,
          style_code: item.styleV2.code,
        });
        if (inventory) {
          inventory.quantity = inventory.quantity - 1;
          inventory.markModified("quantity");
          await inventory.save();
        }
      } else {
        console.log("just reprinting");
      }
      console.log("saving", item.pieceId, item.batchID);
      item.save();
      updated++;
    } catch (err) {
      console.log(err);
    }
  }
  return updated;
};

const buildLabelData = async (items, opts = {}) => {
  let labelSort = [];

  const foundOrders = {};
  let i = 0
  for (let item of items) {
    i++
    try {
      if (!item.order) continue;
      let totalQuantity = 0;
      let frontBackString;
      if (item.order) {
        try {
          let order;
          if (foundOrders[item.order._id]) {
            order = foundOrders[item.order._id];
          } else {
            order = await Order.findOne({ _id: item.order._id })
              .populate("items")
              .select("items")
              .lean();
            foundOrders[item.order._id] = order;
          }
          totalQuantity = order.items.filter((i) => !i.canceled).length;
        } catch (err) {
          console.log(err);
        }
      }

      console.log(totalQuantity, "TQ");
      let isDTF = false;
      if (DTF.includes(item.styleV2.code) && item.shippingType == "Standard")
        isDTF = true;
      if (item.design.back) {
        if (item.design?.front && item.design.back) {
          frontBackString = `^LH12,18^CFS,25,12^AXN,80,50^FO200,540^FDFRONT&BACK^FS`;
        } else {
          frontBackString = `^LH12,18^CFS,25,12^AXN,80,50^FO200,540^FDBACK ONLY^FS`;
        }
      }
      let printPO = opts.printPO
        ? `^LH12,18^CFS,25,12^AXN,45,30^FO150,540^FDPO:${opts.printPO}^FS`
        : "";

      let printTypeAbbr;
      if (item?.type && item?.type?.toLowerCase() == "dtf")
        printTypeAbbr = "DTF";
      if (item?.type && item?.type?.toLowerCase() == "gift")
        printTypeAbbr = "GIFT";
      if (item?.type && item?.type?.toLowerCase() == "sublimation")
        printTypeAbbr = "SUB";
      if (item?.type && item?.type?.toLowerCase() == "embroidery")
        printTypeAbbr = "EMB";

      let labelString = `^XA
        ^FO50,80^BY2^BC,120,N,N,N,A^FD${item.pieceId}^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO15,30^FDPO#: ${
            item.order ? item.order.poNumber : "no order"
        }^FS
        ^LH6,6^CFS,30,6^AXN,22,30^FO15,60^FDPiece: ${item.pieceId}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,330^FD#${i}^FS
        ^LH12,18^CFS,25,12^AXN,75,90^FO120,250^FD${item.styleCode}^FS
        ^LH12,18^CFS,25,12^AXN,30,35^FO20,360^FD${
            item.colorName
        }^FS
        ^LH12,18^CFS,25,12^AXN,30,35^FO20,390^FD ${item.sizeName}^FS
         ^LH12,18^CFS,25,12^AXN,22,30^FO20,430^FDShipping: ${item.shippingType}^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,480^FD PrintO Design: ${
            item.sku.split("-")[0]
        }^FS
        ^LH12,18^CFS,25,12^AXN,22,30^FO20,500^FDCNT: ${totalQuantity}^FS
        ${
            printTypeAbbr
            ? `^LH12,18^CFS,25,12^AXN,40,50^FO20,230^FD${printTypeAbbr}^FS`
            : ""
        }
        ${printPO}
        ${frontBackString}
    ^XZ`;
      if (item.styleV2 && item.styleV2.code) {
        labelSort.push({
          vendor: item.vendor,
          style: item.styleV2 && item.styleV2.code,
          color: item.color && item.color.name,
          size: item.size && item.sizeName,
          label: labelString,
          shippingType: item.shippingType,
          id: item._id,
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  let doFirst = ["Expedited", "Second Day", "Next Day"];

  labelSort = labelSort.filter(
    (l) => l.style && l.style.length > 0 && typeof l.style == "string"
  );

  labelSort.sort((a, b) => a.size.localeCompare(b.size));
  labelSort.sort((a, b) => a.color.localeCompare(b.color));
  labelSort.sort((a, b) => a.style.localeCompare(b.style));

  //sort by do first like just if there in do first than 1 else 0
  labelSort.sort((a, b) => {
    const aIsDoFirst = doFirst.includes(a.shippingType) ? 1 : 0;
    const bIsDoFirst = doFirst.includes(b.shippingType) ? 1 : 0;
    return bIsDoFirst - aIsDoFirst;
  });

  labelSort.forEach((l, i) => {
    l.label = l.label.replace("{IDX}", i + 1);
  });

  return labelSort;
};

export async function POST(req=NextApiResponse) {

    let printedOn = new Date();
    let batchID = "";

    for (let i = 0; i < 9; i++) {
        batchID = batchID + letters[Math.floor(Math.random() * letters.length)];
    }
    if (req.body.batchID) {
        batchID = req.body.batchID;
    }
    let items;
    if (req.body.labels) {
        items = await Item.find({ _id: { $in: req.body.labels } }).populate(
        "order styleV2 size color"
        );
    } else {
        let shippingType = "Standard";
        if (req.body.type != "Standard") shippingType = { $ne: "Standard" };
        items = await Item.find({
        labelPrinted: false,
        paid: true,
        canceled: false,
        shippingType: shippingType,
        type: { $nin: ["sublimation", "gift"] },
        }).populate("order styleV2 size color");
        let inStockItems = [];

        let pendingInventoryQuantities = {};

        for (let item of items) {
        if (!item.order) continue;
        if (!item.styleV2) continue;
        let inventory = await Inventory.findOne({
            color_name: item.color.name,
            size_name: item.sizeName,
            style_code: item.styleV2.code,
        }).lean();

        if (inventory) {
            if (pendingInventoryQuantities[inventory._id] == undefined) {
            pendingInventoryQuantities[inventory._id] = inventory.quantity;
            }

            if (pendingInventoryQuantities[inventory._id] > 0) {
            pendingInventoryQuantities[inventory._id] -= 1;
            inStockItems.push(item);
            }
        }
        }
        //only print in stock items
        items = inStockItems;
    }

    let labelSort = await buildLabelData(items, {
        printPO: req.body.printPO,
    });

    let skipIdx = req.body?.skipIdx;
    if (skipIdx) {
        labelSort = labelSort.slice(skipIdx, labelSort.length);
    }

    let success = await printLabels(labelSort);
    console.log(success, "__PRINT LABELS");
    if (success) {
        let updated = await markLabelsPrinted(labelSort, {
        batchID,
        printedOn,
        type: req.body.type,
        });
        if (req.body.type != "reprint") {
        let batch = new Batch({ batchID, count: updated, date: new Date() });
        await batch.save();
        }
        return NextResponse.json({ error: false, msg: "labels printed" });
    } else {
        return NextResponse.json({ error: true, msg: "something went wrong" });
    }
}
