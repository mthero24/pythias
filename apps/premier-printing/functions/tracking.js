import { Order } from "@pythias/mongo";
import { createTracking } from "@pythias/backend/server";
import { postProviderStatus } from "@/functions/notifyPlatform";

export const { trackOrder, runTracking, runTrackingAll } = createTracking({
    Order,
    // Commerce Cloud orders: when tracking shows delivered, notify the platform/client.
    onDelivered: (order) => {
        if (order.marketplace === "Commerce Cloud") {
            postProviderStatus({ providerOrderId: order._id.toString(), status: "delivered" });
        }
    },
    uspsCredentials: () => ({
        clientId: process.env.uspsClientId,
        clientSecret: process.env.uspsClientSecret,
        crid: process.env.uspsCRID,
        mid: process.env.uspsMID,
        manifestMID: process.env.manifestMID,
        accountNumber: process.env.accountNumber,
        api: "apis",
    }),
    fedexCredentials: () => ({
        accountNumber: process.env.AccountFedExTest,
        key: process.env.ApiKeyTestFedEx,
        secret: process.env.SecretKeyFedExTest,
    }),
    upsCredentials: () => ({
        clientID: process.env.upsClientId,
        clientSecret: process.env.upsClientSecret,
    }),
});
