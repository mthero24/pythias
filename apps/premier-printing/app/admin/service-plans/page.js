import { ServicePlanPremier } from "@pythias/mongo";
import { ServicePlansMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function ServicePlansPage() {
    const plans = await ServicePlanPremier.find({}).sort({ appName: 1 }).lean();
    return <ServicePlansMain initialPlans={JSON.parse(JSON.stringify(plans))} />;
}
