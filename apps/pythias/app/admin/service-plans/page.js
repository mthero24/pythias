import { ServicePlanPremier, ServicePlanPo } from "@pythias/mongo";
import { ServicePlansMain } from "@pythias/backend";
export const dynamic = "force-dynamic";

export default async function ServicePlansPage() {
    const [premierPlans, poPlans] = await Promise.all([
        ServicePlanPremier.find({}).sort({ appName: 1 }).lean(),
        ServicePlanPo.find({}).sort({ appName: 1 }).lean(),
    ]);
    const plans = [
        ...premierPlans.map(p => ({ ...p, _client: "premier-printing" })),
        ...poPlans.map(p => ({ ...p, _client: "po" })),
    ];
    return <ServicePlansMain initialPlans={JSON.parse(JSON.stringify(plans))} canManage />;
}
