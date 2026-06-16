"use client";
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";

// Buyer-facing custom-text designer. Loads the product's DesignTemplate (Fabric canvas + field
// definitions) and renders a LIVE preview as the buyer types. Matches the admin editor convention:
// Fabric 5.3.1 from CDN, customizable text objects tagged with `fieldId`. The captured field values
// are authoritative for production (which re-renders the final artwork server-side).
const FABRIC_SRC = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
function loadFabric() {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined") return reject(new Error("no window"));
        if (window.fabric) return resolve(window.fabric);
        const existing = document.getElementById("fabric-cdn");
        if (existing) { existing.addEventListener("load", () => resolve(window.fabric)); return; }
        const s = document.createElement("script");
        s.id = "fabric-cdn"; s.src = FABRIC_SRC;
        s.onload = () => resolve(window.fabric); s.onerror = () => reject(new Error("Couldn't load the designer"));
        document.body.appendChild(s);
    });
}

const Customizer = forwardRef(function Customizer({ templateId }, ref) {
    const canvasElRef = useRef(null);
    const fabricRef = useRef(null);
    const [fields, setFields] = useState([]);
    const [values, setValues] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let disposed = false;
        (async () => {
            try {
                const d = await (await fetch(`/api/public/design-template?id=${templateId}`)).json();
                if (d.error) throw new Error(d.msg || "This design is unavailable.");
                const t = d.template;
                const F = await loadFabric();
                if (disposed || !canvasElRef.current) return;
                const c = new F.StaticCanvas(canvasElRef.current, { width: t.canvasWidth || 480, height: t.canvasHeight || 560, backgroundColor: "#ffffff" });
                fabricRef.current = c;
                c.loadFromJSON(t.canvasJson, () => { if (!disposed) c.renderAll(); });
                const flds = t.customizableFields || [];
                const init = {}; flds.forEach((f) => { init[f.id] = f.defaultValue || ""; });
                setFields(flds); setValues(init); setLoading(false);
            } catch (e) { if (!disposed) { setError(e.message); setLoading(false); } }
        })();
        return () => { disposed = true; try { fabricRef.current?.dispose(); } catch { /* ignore */ } };
    }, [templateId]);

    const onChange = (fieldId, value) => {
        setValues((v) => ({ ...v, [fieldId]: value }));
        const c = fabricRef.current; if (!c) return;
        c.getObjects().forEach((o) => { if (o.fieldId === fieldId && o.type && o.type.includes("text")) o.set("text", value || " "); });
        c.renderAll();
    };

    useImperativeHandle(ref, () => ({
        // Returns { fields:[{id,label,value}] } or { error } if a required field is empty.
        getResult: () => {
            for (const f of fields) if (f.required && !String(values[f.id] || "").trim()) return { error: `Please fill in “${f.label}”.` };
            return { fields: fields.map((f) => ({ id: f.id, label: f.label, value: String(values[f.id] || "") })) };
        },
        hasFields: () => fields.length > 0,
    }), [fields, values]);

    return (
        <div style={{ marginBottom: 18 }}>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", display: "flex", justifyContent: "center", background: "#fff", padding: 8 }}>
                <canvas ref={canvasElRef} style={{ maxWidth: "100%", height: "auto" }} />
            </div>
            {loading && <div style={{ color: "#64748b", fontSize: "0.85rem", marginTop: 8 }}>Loading the designer…</div>}
            {error && <div style={{ color: "#dc2626", fontSize: "0.85rem", marginTop: 8 }}>{error}</div>}
            {!loading && !error && (
                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Personalize it ✏️</div>
                    {fields.length === 0 && <div style={{ color: "#64748b", fontSize: "0.85rem" }}>This design has no editable text.</div>}
                    {fields.map((f) => (
                        <label key={f.id} style={{ display: "grid", gap: 4 }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{f.label}{f.required ? " *" : ""}</span>
                            <input value={values[f.id] || ""} maxLength={f.maxLength || 50} placeholder={f.placeholder || ""}
                                onChange={(e) => onChange(f.id, e.target.value)}
                                style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: "0.95rem" }} />
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
});

export default Customizer;
