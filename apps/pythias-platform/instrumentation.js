export async function register() {
    // DB connections are lazy-initialized on first use via @pythias/mongo
}

// Global server-error capture. Next calls this for every uncaught error in a route/render, so we
// record it (route, method, stack, digest) without wrapping each handler. Never throws.
export async function onRequestError(error, request, context) {
    // logError pulls Mongo + crypto (node-only). NEXT_RUNTIME is inlined per bundle, so this early return
    // dead-code-eliminates the import from the edge bundle; the lightweight path avoids the pdfkit barrel.
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    try {
        // webpackIgnore: don't bundle the node-only logger (Mongo + crypto) — resolve it at runtime, so it
        // never lands in the edge bundle (where "node:" / fs can't resolve). The guard above keeps it node-only.
        const { logError } = await import(/* webpackIgnore: true */ "@pythias/backend/logError");
        await logError({
            error,
            app: "platform",
            provider: "platform",
            route: request?.path || "",
            method: request?.method || "",
            source: context?.routePath || request?.path || "",
            context: { routeType: context?.routeType, routerKind: context?.routerKind, renderSource: context?.renderSource },
        });
    } catch { /* never let logging break the request */ }
}
