import { Fragment } from "react";
import { SECTION_REGISTRY } from "../sections/registry";

// Render an ordered list of sections ({ type, settings }) into components.
// `data` is an array aligned to `sections` (data[i] = the resolved data for that
// section, or null). Unknown section types are skipped (forward-compatible).
//
// A/B testing (optional): `experiments` maps a section's _id → { id, variants:[{key,config}] }.
// For an experimented section we render EVERY variant server-side (control "A" = live settings; other
// variants merge config onto settings) and wrap them in `ExperimentSlot` — a client component supplied
// by the host app that shows the bucketed variant. Kept as an injected prop so this package doesn't depend
// on the app's experiment context. Variant overrides are presentational (copy/links/styling); the resolved
// `data` is shared across variants (product queries use the live setting).
export default function SectionRenderer({ sections = [], site, data = [], experiments = {}, ExperimentSlot = null }) {
    return (
        <>
            {sections.map((s, i) => {
                const Component = SECTION_REGISTRY[s?.type];
                if (!Component) return null;
                const sid = s._id?.toString?.();
                const key = sid ?? i;
                const exp = sid ? experiments[sid] : null;

                if (exp && ExperimentSlot && exp.variants?.length > 1) {
                    return (
                        <ExperimentSlot key={key} experimentId={exp.id}>
                            {exp.variants.map((v) => (
                                <div data-vk={v.key} key={v.key}>
                                    <Component settings={{ ...(s.settings ?? {}), ...(v.config || {}) }} data={data?.[i] ?? null} site={site} />
                                </div>
                            ))}
                        </ExperimentSlot>
                    );
                }
                return <Fragment key={key}><Component settings={s.settings ?? {}} data={data?.[i] ?? null} site={site} /></Fragment>;
            })}
        </>
    );
}
