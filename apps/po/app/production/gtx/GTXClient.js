"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const POLL_MS = 5000;

const s = {
    page: { minHeight: "100vh", background: "#0f1117", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", padding: "0" },
    topBar: { background: "#1a1d2e", borderBottom: "1px solid #2d3148", padding: "12px 20px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10 },
    topTitle: { fontSize: "18px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginRight: "auto" },
    printerSelect: { background: "#252840", color: "#e2e8f0", border: "1px solid #3d4168", borderRadius: "8px", padding: "8px 14px", fontSize: "14px", fontWeight: 600, cursor: "pointer", outline: "none" },
    scanForm: { display: "flex", gap: "8px", flex: "1", minWidth: "260px", maxWidth: "480px" },
    scanInput: { flex: 1, background: "#252840", color: "#fff", border: "1px solid #3d4168", borderRadius: "8px", padding: "10px 14px", fontSize: "16px", fontWeight: 600, outline: "none", letterSpacing: "0.05em" },
    scanBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "14px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
    main: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "0", minHeight: "calc(100vh - 62px)" },
    left: { padding: "20px", borderRight: "1px solid #2d3148" },
    right: { background: "#13162a", overflowY: "auto", maxHeight: "calc(100vh - 62px)" },
    sectionLabel: { fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" },
    printerCard: { background: "#1a1d2e", border: "1px solid #2d3148", borderRadius: "12px", padding: "20px", marginBottom: "16px" },
    printerCardEmpty: { background: "#1a1d2e", border: "1px solid #2d3148", borderRadius: "12px", padding: "40px 20px", textAlign: "center", color: "#4b5563" },
    itemRow: { display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" },
    itemImage: { width: "120px", height: "120px", objectFit: "contain", borderRadius: "8px", background: "#252840", flexShrink: 0 },
    itemImagePlaceholder: { width: "120px", height: "120px", borderRadius: "8px", background: "#252840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", flexShrink: 0 },
    itemMeta: { flex: 1, minWidth: "160px" },
    itemPieceId: { fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "0.04em", lineHeight: 1 },
    itemOrderId: { fontSize: "13px", color: "#9ca3af", marginTop: "4px" },
    itemBadge: { display: "inline-block", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, marginTop: "8px", background: "#4f46e520", color: "#818cf8", border: "1px solid #4f46e540" },
    itemDetail: { fontSize: "14px", color: "#d1d5db", marginTop: "6px", lineHeight: 1.6 },
    notesBadge: { background: "#7f1d1d", color: "#fca5a5", border: "1px solid #991b1b", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", marginTop: "12px", display: "flex", alignItems: "flex-start", gap: "8px" },
    actionRow: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" },
    btn: (color) => ({ background: color, color: "#fff", border: "none", borderRadius: "10px", padding: "12px 18px", fontSize: "14px", fontWeight: 700, cursor: "pointer", minWidth: "120px", transition: "opacity 0.15s" }),
    btnSm: (color) => ({ background: color, color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }),
    btnDryer: { background: "#059669", color: "#fff", border: "none", borderRadius: "10px", padding: "14px 28px", fontSize: "16px", fontWeight: 800, cursor: "pointer", minWidth: "180px" },
    btnClearAll: { background: "#1f2937", color: "#9ca3af", border: "1px solid #374151", borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, cursor: "pointer" },
    pendingScanBox: { background: "#1e1b4b", border: "1px solid #4338ca", borderRadius: "12px", padding: "16px 20px", marginBottom: "16px" },
    pendingScanTitle: { fontSize: "14px", fontWeight: 700, color: "#a5b4fc", marginBottom: "10px" },
    pendingScanItem: { display: "inline-block", background: "#312e81", color: "#c7d2fe", borderRadius: "6px", padding: "4px 12px", fontSize: "14px", fontWeight: 700, marginRight: "8px", marginBottom: "8px", letterSpacing: "0.04em" },
    sendScanBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "15px", fontWeight: 700, cursor: "pointer", marginTop: "8px", display: "block" },
    queueHeader: { padding: "16px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" },
    queueTitle: { fontSize: "14px", fontWeight: 700, color: "#9ca3af" },
    queueCount: { background: "#252840", color: "#6b7280", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 600 },
    queueItem: { padding: "14px 20px", borderBottom: "1px solid #1f2937", display: "flex", alignItems: "center", gap: "12px" },
    queueRank: { fontSize: "12px", fontWeight: 700, color: "#4b5563", width: "20px", textAlign: "center" },
    queuePieceId: { fontSize: "15px", fontWeight: 700, color: "#e2e8f0", flex: 1 },
    queueMeta: { fontSize: "12px", color: "#6b7280" },
    queueActions: { display: "flex", gap: "6px" },
    errorBox: { background: "#1f0909", border: "1px solid #7f1d1d", borderRadius: "10px", padding: "12px 16px", marginBottom: "12px", color: "#fca5a5", fontSize: "13px" },
    pollDot: (active) => ({ width: "8px", height: "8px", borderRadius: "50%", background: active ? "#10b981" : "#374151", display: "inline-block", marginLeft: "8px" }),
    loadOverlay: { position: "fixed", inset: 0, background: "#00000088", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
    spinner: { width: "40px", height: "40px", border: "4px solid #ffffff22", borderTop: "4px solid #818cf8", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};

export default function GTXClient({ printers = ["printer1", "printer2", "printer3"] }) {
    const [printer, setPrinter] = useState(printers[0] ?? "printer1");
    const [onPrinter, setOnPrinter] = useState(null);
    const [printerQue, setPrinterQue] = useState([]);
    const [scanQueue, setScanQueue] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [polling, setPolling] = useState(true);
    const scanRef = useRef(null);
    const pollTimer = useRef(null);

    const fetchState = useCallback(async (p = printer) => {
        try {
            setPolling(true);
            const res = await fetch(`/api/production/gtx?printer=${p}`);
            const data = await res.json();
            if (!data.error) {
                setOnPrinter(data.onPrinter || null);
                setPrinterQue(data.printerQue || []);
            }
        } catch (_) {}
        finally { setPolling(false); }
    }, [printer]);

    useEffect(() => {
        fetchState(printer);
        pollTimer.current = setInterval(() => fetchState(printer), POLL_MS);
        return () => clearInterval(pollTimer.current);
    }, [printer, fetchState]);

    const api = async (body) => {
        setLoading(true);
        try {
            const res = await fetch("/api/production/gtx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, printer }) });
            const data = await res.json();
            if (data.errors && Object.keys(data.errors).length) setErrors(data.errors);
            else setErrors({});
            await fetchState(printer);
            return data;
        } catch (e) {
            setErrors({ _: String(e) });
        } finally {
            setLoading(false);
        }
    };

    const onScanSubmit = (e) => {
        e.preventDefault();
        const val = (scanRef.current?.value || "").toUpperCase().trim();
        if (!val) return;
        scanRef.current.value = "";
        setScanQueue((q) => [...new Set([...q, val])]);
    };

    const sendScanQueue = async () => {
        if (!scanQueue.length) return;
        await api({ action: "scan", pieceIDs: scanQueue });
        setScanQueue([]);
    };

    const removeScanItem = (id) => setScanQueue((q) => q.filter((x) => x !== id));

    const changePrinter = (p) => {
        setPrinter(p);
        setScanQueue([]);
        setErrors({});
    };

    const notes = onPrinter?.order?.notes?.filter((n) => n.note) || [];

    return (
        <div style={s.page}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}} input:focus{border-color:#4f46e5!important} button:hover{opacity:.85}`}</style>
            {loading && (
                <div style={s.loadOverlay}>
                    <div style={s.spinner} />
                </div>
            )}

            <div style={s.topBar}>
                <span style={s.topTitle}>GTX Production</span>
                <select style={s.printerSelect} value={printer} onChange={(e) => changePrinter(e.target.value)}>
                    {printers.map((p) => <option key={p} value={p}>{p.replace("printer", "Printer ")}</option>)}
                </select>
                <form style={s.scanForm} onSubmit={onScanSubmit}>
                    <input ref={scanRef} style={s.scanInput} placeholder="Scan piece ID..." autoFocus autoComplete="off" />
                    <button type="submit" style={s.scanBtn}>Add</button>
                </form>
                <span style={s.pollDot(!polling)} title={polling ? "Polling..." : "Live"} />
            </div>

            {scanQueue.length > 0 && (
                <div style={{ padding: "12px 20px 0" }}>
                    <div style={s.pendingScanBox}>
                        <div style={s.pendingScanTitle}>Scan Queue ({scanQueue.length}) — ready to send</div>
                        <div>
                            {scanQueue.map((id) => (
                                <span key={id} style={s.pendingScanItem} onClick={() => removeScanItem(id)} title="Click to remove">
                                    {id} ×
                                </span>
                            ))}
                        </div>
                        <button style={s.sendScanBtn} onClick={sendScanQueue}>
                            Send {scanQueue.length} to Printer →
                        </button>
                    </div>
                </div>
            )}

            {Object.keys(errors).length > 0 && (
                <div style={{ padding: "0 20px" }}>
                    {Object.entries(errors).map(([id, msg]) => (
                        <div key={id} style={s.errorBox}>⚠ {id !== "_" ? `${id}: ` : ""}{msg}</div>
                    ))}
                </div>
            )}

            <div style={{ ...s.main, gridTemplateColumns: "1fr 360px" }}>
                <div style={s.left}>
                    <div style={s.sectionLabel}>On Printer</div>
                    {onPrinter ? (
                        <div style={s.printerCard}>
                            {notes.map((n) => (
                                <div key={n._id} style={s.notesBadge}>
                                    <span>⚠</span>
                                    <span>{new Date(n.date).toLocaleDateString("en-US")} — {n.note}</span>
                                </div>
                            ))}
                            <div style={s.itemRow}>
                                {onPrinter.design?.front ? (
                                    <img src={onPrinter.design.front} alt="design" style={s.itemImage} />
                                ) : (
                                    <div style={s.itemImagePlaceholder}>🖨</div>
                                )}
                                <div style={s.itemMeta}>
                                    <div style={s.itemPieceId}>{onPrinter.pieceId}</div>
                                    <div style={s.itemOrderId}>Order: {onPrinter.order?.poNumber}</div>
                                    <div style={s.itemBadge}>{onPrinter.blank?.code}</div>
                                    <div style={s.itemDetail}>
                                        <strong>Color:</strong> {onPrinter.colorName}<br />
                                        <strong>Size:</strong> {onPrinter.sizeName}<br />
                                        {onPrinter.design?.back && <span style={{ color: "#818cf8" }}>✓ Has back design</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: "20px" }}>
                                <button style={s.btnDryer} onClick={() => api({ action: "send-to-dryer" })}>✓ Send to Dryer</button>
                            </div>
                            <div style={s.actionRow}>
                                <button style={s.btn("#1e40af")} onClick={() => api({ action: "repull", pieceID: onPrinter.pieceId })}>↻ Repull</button>
                                <button style={s.btn("#3730a3")} onClick={() => api({ action: "resend", pieceID: onPrinter.pieceId })}>⟳ Resend</button>
                                <button style={s.btn("#b45309")} onClick={() => api({ action: "print-as-white", pieceID: onPrinter.pieceId })}>Print as White</button>
                                <button style={s.btn("#6b7280")} onClick={() => api({ action: "print-as-ash", pieceID: onPrinter.pieceId })}>Print as Ash</button>
                                <button style={s.btn("#7f1d1d")} onClick={() => { if (confirm("Clear this item from printer?")) api({ action: "clear", pieceID: onPrinter.pieceId }); }}>Clear</button>
                            </div>
                        </div>
                    ) : (
                        <div style={s.printerCardEmpty}>
                            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🖨</div>
                            <div style={{ fontSize: "16px", fontWeight: 600 }}>Nothing on printer</div>
                            <div style={{ fontSize: "13px", marginTop: "6px", color: "#6b7280" }}>Scan a piece ID to load the first item</div>
                        </div>
                    )}
                    {printerQue.length > 0 && (
                        <div style={{ marginTop: "24px" }}>
                            <div style={s.sectionLabel}>Up next</div>
                            <div style={s.printerCard}>
                                <div style={s.itemRow}>
                                    {printerQue[0].design?.front ? (
                                        <img src={printerQue[0].design.front} alt="design" style={{ ...s.itemImage, width: "80px", height: "80px", opacity: 0.7 }} />
                                    ) : (
                                        <div style={{ ...s.itemImagePlaceholder, width: "80px", height: "80px", opacity: 0.7 }}>🖨</div>
                                    )}
                                    <div style={s.itemMeta}>
                                        <div style={s.itemPieceId}>{printerQue[0].pieceId}</div>
                                        <div style={s.itemOrderId}>Order: {printerQue[0].order?.poNumber}</div>
                                        <div style={s.itemDetail}>{printerQue[0].colorName} · {printerQue[0].sizeName} · {printerQue[0].blank?.code}</div>
                                    </div>
                                    <button style={s.btn("#1e3a5f")} onClick={() => api({ action: "send-to-printer", pieceID: printerQue[0].pieceId })}>Load →</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={s.right}>
                    <div style={s.queueHeader}>
                        <span style={s.queueTitle}>Queue</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span style={s.queueCount}>{printerQue.length}</span>
                            {printerQue.length > 0 && (
                                <button style={s.btnClearAll} onClick={() => { if (confirm("Clear entire queue?")) api({ action: "clear-all" }); }}>Clear All</button>
                            )}
                        </div>
                    </div>
                    {printerQue.length === 0 && (
                        <div style={{ padding: "40px 20px", textAlign: "center", color: "#4b5563", fontSize: "14px" }}>Queue is empty</div>
                    )}
                    {printerQue.map((item, i) => (
                        <div key={item.pieceId} style={s.queueItem}>
                            <span style={s.queueRank}>{i + 1}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={s.queuePieceId}>{item.pieceId}</div>
                                <div style={s.queueMeta}>{item.colorName} · {item.sizeName} · {item.blank?.code}</div>
                                <div style={{ ...s.queueMeta, color: "#4b5563", fontSize: "11px" }}>{item.order?.poNumber}</div>
                            </div>
                            <div style={s.queueActions}>
                                <button style={s.btnSm("#1e3a5f")} onClick={() => api({ action: "send-to-printer", pieceID: item.pieceId })} title="Load onto printer">→</button>
                                <button style={s.btnSm("#7f1d1d")} onClick={() => api({ action: "clear", pieceID: item.pieceId })} title="Remove from queue">×</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
