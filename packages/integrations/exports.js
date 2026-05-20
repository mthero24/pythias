export {getOrders, updateOrder, cancelOrder, getPages, getPageOrders} from "./functions/shipstation";
export {generatePieceID} from "./functions/createPiceId";
export {getOrders as getOrderKohls} from "./functions/kohls"

//gs1

export { NextGTIN, CreateUpdateUPC, createTempUpcs, updateTempUpc } from "./functions/gs1";

//acenda
export {getTokenAcenda, getWarehouseAcenda, getCatalogAcenda, getSkuAcenda, addInventoryAcenda, getShipAdviceAcenda, acknowledgeShipAdviceAcenda, fulfillShipAdviceAcenda, getSalesChannelsAcenda, getInventoryDetailAcenda} from "./functions/acenda"
export {createTargetCsv} from "./functions/csvfunctions/acenda";
//walmart
export {
    getItemsWalmart, getItemWalmart, retireItemWalmart, getSpecWalmart,
    bulkUploadWalmart, bulkPriceUpdateWalmart, bulkInventoryUpdateWalmart,
    listFeedsWalmart, getFeedWalmart, getFeedItemsWalmart,
    updatePriceWalmart, getInventoryWalmart, updateInventoryWalmart,
    getOrdersWalmart, getReleasedOrdersWalmart, getOrderWalmart,
    acknowledgeOrderWalmart, bulkAcknowledgeOrdersWalmart, shipOrderWalmart,
} from "./functions/walmart"

export {Main} from "./components/Main";
export {WalmartDashboard} from "./components/WalmartDashboard";
export {FaireDashboard} from "./components/FaireDashboard";
export {AcendaDashboard} from "./components/AcendaDashboard";
export {ShopifyDashboard} from "./components/ShopifyDashboard";
export {createTikTokCsv} from "./functions/csvfunctions/tiktok";
export {createShopifyCsv} from "./functions/csvfunctions/shopify";
export {
  getAuthorizedShops,
  getAccessTokenFromRefreshToken,
  getAccessTokenUsingAuthCode,
  uploadProductImage,
  generateAuthorizationUrl,
  getRecommendedCategory,
  getWarehouses,
  getAttributes,
  createProduct,
  getOrders as getOrdersTikTok,
} from "./functions/tiktokpy";

export {generateRedirectURI, getToken, refreshToken, createDraftListing, updateListingFrom, fetchOrders, createReceiptShipment, getOpenReceiptsEtsy} from "./functions/etsy";

// amazon
export { getAmazonAccessToken, getOrdersAmazon, getOrderItemsAmazon, confirmShipmentAmazon, createListingAmazon, getCatalogItemsAmazon } from "./functions/amazon";
export { handleAmazonTestPOST, handleAmazonGET, handleAmazonOrdersGET, handleAmazonOrdersPOST, handleAmazonSendPOST } from "./handlers/amazon";

// target
export { testTargetConnection, getOrdersTarget, acknowledgeOrderTarget, shipOrderTarget, getShippingMethodsTarget } from "./functions/target";
export { handleTargetTestPOST, handleTargetOrdersGET, handleTargetOrdersPOST } from "./handlers/target";

// shein
export { sheinHeaders, sheinRequest, convertImageShein, getOrdersShein, shipOrderShein } from "./functions/shein";

// temu
export { temuSign, temuRequest, uploadImageTemu, addProductTemu, getOrdersTemu, shipOrderTemu } from "./functions/temu";

// faire
export {
    getBrandProfileFaire,
    getProductsFaire, getProductFaire, createProductFaire, updateProductFaire, deleteProductFaire,
    getTaxonomyTypesFaire, uploadImageFaire,
    addVariantFaire, updateVariantFaire, deleteVariantFaire,
    getInventoryBySkusFaire, updateInventoryBySkusFaire, updateInventoryByIdsFaire,
    updatePricesBySkusFaire,
    getOrdersFaire, getOrderFaire, acceptOrderFaire, shipOrderFaire, cancelOrderFaire,
    updateOrderItemAvailabilityFaire,
    getRetailerFaire,
} from "./functions/faire";

// handlers — thin route wrappers call these; shared across all apps
export { handleAcendaPOST, handleAcendaGET, handleAcendaOrdersGET, handleAcendaOrdersPOST, handleAcendaDashboardGET } from "./handlers/acenda";
export { handleEtsyGET, handleEtsyPOST, handleEtsyPUT, handleEtsyOrdersGET, handleEtsyOrdersPOST, handleAdminEtsyGET, handleAdminEtsyPOST, handleAdminEtsyPUT, makeEtsyOAuthRedirectGET } from "./handlers/etsy";
export {
    handleFaireSendPOST,
    handleFaireInventoryGET, handleFaireInventoryPATCH,
    handleFaireOrdersGET, handleFaireOrdersPOST,
    handleFaireProductsGET,
} from "./handlers/faire";
export { handleSheinSendPOST, handleSheinOrdersGET, handleSheinOrdersPOST } from "./handlers/shein";
export { handleTemuSendPOST, handleTemuOrdersGET, handleTemuOrdersPOST } from "./handlers/temu";
export {
    handleWalmartGET, handleWalmartDELETE, handleWalmartSendPOST,
    handleWalmartOrdersGET, handleWalmartOrdersPOST,
    handleWalmartFeedGET,
    handleWalmartImageGET,
    handleWalmartInventoryGET, handleWalmartInventoryPUT,
    handleWalmartPricePUT,
    handleWalmartSpecGET,
    handleWalmartTestPOST,
} from "./handlers/walmart";
export {
    handleAdminIntegrationsGET, handleAdminIntegrationsPOST, handleAdminIntegrationsDELETE,
    handleAdminIntegrationsSettingsPATCH,
} from "./handlers/admin";
export {
    handleShopifyPOST, handleShopifySendPOST, handleShopifyOrdersPOST,
    handleShopifyDeletePOST, handleShopifyProductsDeletePOST,
    handleShopifyRemoveConnectionPOST, handleShopifyUninstallPOST,
    handleShopifyBrandsGET, handleShopifyProductsGET,
} from "./handlers/shopify";
export {
    handleShopifyAdminGET,
    handleShopifySalesGET,
    handleShopifySalesPOST,
    handleShopifySalesDELETE,
    handleShopifyAdminProductsGET,
    handleShopifyOrdersGET,
} from "./handlers/shopifySales";

// mirakl
export { getOrdersMirakl, getOrderMirakl, acceptOrderMirakl, shipOrderMirakl, cancelOrderMirakl, getOffersMirakl } from "./functions/mirakl";
export { handleMiraklGET, handleMiraklOrdersGET, handleMiraklOrdersPOST, handleMiraklOffersGET } from "./handlers/mirakl";
export { MiraklDashboard } from "./components/MiraklDashboard";
export { MiraklModal } from "./components/MiraklModal";