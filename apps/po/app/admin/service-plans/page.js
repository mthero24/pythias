import { ServicePlanPo } from "@pythias/mongo";
import { ServicePlansMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function ServicePlansPage() {
    const plans = await ServicePlanPo.find({}).sort({ appName: 1 }).lean();
    return <ServicePlansMain initialPlans={JSON.parse(JSON.stringify(plans))} />;
}
