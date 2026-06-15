// Lean subpath barrel: ONLY the storefront management UIs. Import these from
// "@pythias/backend/storefront" (not the big "@pythias/backend" barrel) so pages that mount
// the storefront control panel don't pull the entire backend component graph into their bundle.
export { default as StorefrontEditor } from "./StorefrontEditor";
export { default as MarketingClient } from "./MarketingClient";
export { default as AnalyticsClient } from "./AnalyticsClient";
export { default as SeoPagesClient } from "./SeoPagesClient";
export { default as PayoutsClient } from "./PayoutsClient";
export { default as CollectionsClient } from "./CollectionsClient";
export { default as DiscountsClient } from "./DiscountsClient";
