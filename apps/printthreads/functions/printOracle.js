
import axios from "axios";
import { generate } from "text-to-image";
import { Design, Order } from "@pythias/mongo";

let IS_DEV = process.env.NODE_ENV == "development" ? true : false;

const BASE_URL =
  IS_DEV && false ? "http://localhost:3000" : `https://printoracle.com`;
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.printOracle}`, // Set your token here
  },
});

export const printOracle = {
  getStyles: async () => {
    let result = await api.get(`/api/styles`).catch((e) => {
      console.log(e);
    });
    return result.data.styles;
  },
  cancelItem: async (pieceId) => {
    let response = await api.delete(`/api/item/${pieceId}`);
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    return true;
  },
  repullItem: async (pieceId) => {
    let response = await api.post(`/api/item`, { pieceId });
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    return true;
  },
  getOrderInfo: async (orderId) => {
    let order = await Order.findOne({ _id: orderId }).populate("items");
    let response = await api.get(`/api/order?poNumber=${order.poNumber}`);
    let printOracleOrder = response?.data?.order;
    if (!printOracleOrder)
      throw new Error("Order not found on print oracle...");
    order.printOracleID = printOracleOrder.orderId;
    if (
      printOracleOrder.status.toLowerCase() == "shipped" &&
      printOracleOrder.shippingInfo
    ) {
      order.shippingInfo = printOracleOrder.shippingInfo;
    }

    if (order.status != "Complete") {
      order.status = printOracleOrder.status;
    }

    for (let poItem of printOracleOrder.items) {
      let item = order.items.filter((i)=> i.pieceId == poItem.pieceId)[0];
      if (item) {
        item.labelPrinted = poItem.labelPrinted;
        item.folded = poItem.folded;
        item.inBin = poItem.inBin;
        item.printed = poItem.printed;
        item.labelPrintedDates = poItem.labelPrintedDates;
        item.canceled = poItem.canceled;
        item.shipped = poItem.shipped;
        item.steps = poItem.steps;
        await item.save();
      }
    }
    await order.save();

    return printOracleOrder;
  },
  addItemToOrder: async (orderId, item) => {
    let order = await Order.findOne({ _id: orderId });
    let printOracleOrder = await buildPrintOracleOrder(order);
    let newItems = await buildItems({ item });
    
    printOracleOrder.newItems = newItems;
    let result = await api.put(`/api/orders/${order.printOracleID}`, {
      order: printOracleOrder,
    });
  },
  updateOrder: async (orderId) => {
    
    let order = await Order.findOne({ _id: orderId });
    let printOracleOrder = await buildPrintOracleOrder(order);
    let result = await api.put(`/api/orders/${order.printOracleID}`, {
      order: printOracleOrder,
    });
  },
  cancelOrder: async (orderId) => {
    let order = await Order.findOne({ _id: orderId });
    let result = await api.delete(`/api/orders/${order.printOracleID}`);
   
  },
  sendOrder: async (orderId) => {
    let order = await Order.findOne({ _id: orderId }).populate({path: "items", populate: { path: "designRef color size"}});
    let printOracleOrder = await buildPrintOracleOrder(order);
    let result = await api.post(`/api/orders/`, {
      order: printOracleOrder,
    });
    if (result?.data?.status) {
      order.status = result.data.status;
      await order.save();
    }
  },
};


const buildItems = async (orderItems) => {
  let items = [];
  for (let item of orderItems) {
    let styleCode = item.styleCode;
    if (!item.canceled) {
      items.push({
        images: item.design,
        printFiles: item.designRef.embroideryFiles,
        styleCode: styleCode,
        size: item.sizeName,
        color: item.color.name,
        vendor: "print threads",
        sku: `${item.designRef.sku}-${item.colorName}-${item.sizeName}-${item.styleCode}`,
        name: item.name,
        quantity: item.quantity,
        type: item.type,
        pieceId: item.pieceId
      });
    }
  }

  return items;
};

const buildGift = async (item) => {
  let giftItem;
  if (item.sku == "gift-message") {
    giftItem = {
      images: {
        front: await generate(item.message.text, {
          debug: true,
          maxWidth: 720,
          fontSize: 25,
          fontFamily: "cursive",
          lineHeight: 40,
          margin: 100,
          bgColor: item.message.backgroundColor,
          textColor: item.message.color,
        }),
      },
      styleCode: "message",
      size: "lg",
      color: item.message.color,
      vendor: "print oracle",
      sku: "gift-message",
      name: "gift message",
      quantity: 1,
    };
  }
  if (item.sku == "gift-bag") {
    giftItem = {
      images: {
        front: "https//:www.teeshirtpalace.com/images/bags.webp",
      },
      styleCode: "bag",
      size: "lg",
      color: "red",
      vendor: "print oracle",
      sku: "gift-bag",
      name: "gift bag",
      quantity: 1,
    };
  }
  return giftItem;
};

const buildPrintOracleOrder = async (order) => {
  let items = await buildItems(order.items);
  let notes = [];
  if (order.notes) {
    notes = order.notes.map((n) => ({ note: n.note, date: n.date }));
  }
  let sendOrder = {
    poNumber: order.poNumber,
    shippingType: order.shippingType,
    shippingAddress: {
      name: order.shippingAddress.name,
      address1: order.shippingAddress.address1,
      address2: order.shippingAddress.address2,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zip: order.shippingAddress.zip,
      country: order.shippingAddress.country,
    },
    items,
    notes,
  };

  return sendOrder;
};
