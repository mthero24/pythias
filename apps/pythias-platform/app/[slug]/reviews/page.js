import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ReviewsClient } from "@pythias/backend/storefront";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
    const session = await getServerSession(authOptions);
    if (!session) return null;
    return <ReviewsClient />;
}
