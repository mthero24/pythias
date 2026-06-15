import { SECTION_REGISTRY } from "../sections/registry";

// Render an ordered list of sections ({ type, settings }) into components.
// `data` is an array aligned to `sections` (data[i] = the resolved data for that
// section, or null). Unknown section types are skipped (forward-compatible).
export default function SectionRenderer({ sections = [], site, data = [] }) {
    return (
        <>
            {sections.map((s, i) => {
                const Component = SECTION_REGISTRY[s?.type];
                if (!Component) return null;
                return <Component key={s._id?.toString?.() ?? i} settings={s.settings ?? {}} data={data?.[i] ?? null} site={site} />;
            })}
        </>
    );
}
