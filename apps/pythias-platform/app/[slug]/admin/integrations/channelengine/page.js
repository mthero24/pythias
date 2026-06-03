import ChannelEngineDashboard from "./Dashboard";
export const dynamic = "force-dynamic";
export const metadata = { title: "ChannelEngine - Premier Printing" };

export default function ChannelEnginePage() {
    const apiUrl = process.env.ChannelEnginAPIURL ?? "";
    // Extract tenant slug from URL: https://{tenant}.channelengine.net/api/
    const tenant = apiUrl.match(/https?:\/\/([^.]+)\.channelengine\.net/)?.[1] ?? null;
    return <ChannelEngineDashboard tenant={tenant} />;
}
