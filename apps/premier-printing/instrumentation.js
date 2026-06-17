// Global server-error capture. Next calls this for every uncaught error in a route/render, so we
// record it (route, method, stack, digest) without wrapping each handler. Never throws.
export async function onRequestError(error, request, context) {
    try {
        const { logError } = await import("@pythias/backend/server");
        await logError({
            error,
            app: "premier",
            provider: "premierPrinting",
            route: request?.path || "",
            method: request?.method || "",
            source: context?.routePath || request?.path || "",
            context: { routeType: context?.routeType, routerKind: context?.routerKind, renderSource: context?.renderSource },
        });
    } catch { /* never let logging break the request */ }
}
