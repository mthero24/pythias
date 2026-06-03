import { Order } from "@pythias/mongo";
import { createTracking } from "@pythias/backend/server";

export const { trackOrder, runTracking, runTrackingAll } = createTracking({
    Order,
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
