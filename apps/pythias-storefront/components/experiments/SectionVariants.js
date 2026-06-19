"use client";
import { Children, cloneElement } from "react";
import { useExperiment } from "@/components/experiments/ExperimentProvider";

// Client picker for a section A/B test. The server renders EVERY variant of the section (each wrapped in
// an element carrying `data-vk="<key>"`) so all variants are present in the HTML payload; this component
// just toggles which one is visible. It shows the control (variant "A") until the experiment provider has
// assigned a bucket — so SSR/no-JS/crawlers see the control and there's no hydration mismatch, and the
// client can swap to the bucketed variant without needing the section component code in its bundle.
export default function SectionVariants({ experimentId, children }) {
    const { variantForId } = useExperiment();
    const vk = variantForId(experimentId);
    return Children.map(children, (child) => {
        if (!child) return child;
        const shown = child.props?.["data-vk"] === vk;
        return cloneElement(child, { style: { ...(child.props?.style || {}), display: shown ? undefined : "none" } });
    });
}
