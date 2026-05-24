export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { warmTenantCache } = await import("@pythias/mongo");
        await warmTenantCache();
    }
}
