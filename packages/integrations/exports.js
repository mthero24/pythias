export {getOrders, updateOrder} from "./functions/shipstation";
export {generatePieceID} from "./functions/createPiceId";
export {getOrders as getOrderKohls} from "./functions/kohls"

//gs1

export {NextGTIN, CreateUpdateUPC} from "./functions/gs1";

//acenda

export {getTokenAcenda} from "./functions/acenda"
export {getTokenWalmart} from "./functions/walmart"