"use client";
import {
  Box, Card, CardContent, Typography, Button, Chip,
  Stack, CircularProgress, Snackbar, Alert, Paper, ButtonBase,
} from "@mui/material";
import { useState, useMemo } from "react";
import Image from "next/image";
import axios from "axios";
import { createImage } from "../functions/image";
import Link from "next/link";
import { Footer } from "@pythias/backend";
import InboxIcon from "@mui/icons-material/Inbox";

const MUG_CODES    = ["CFM", "TMUG", "BYEH300W", "21150"];
const EPSON_CODES  = ["MSP", "CST"];
const CREATE_CODES = ["BST", "TMUG", "BYEH300W", "21150", "TH", "SSB", "AWB", "SLT", "TEDB", "WRPP", "CANV", "ORN", "ORO", "ORT"];

const TABS = [
  { key: "sublimation",   label: "Mugs" },
  { key: "posters",       label: "Posters" },
  { key: "premiumPoster", label: "Premium" },
  { key: "buttons",       label: "Buttons" },
  { key: "epson",         label: "Epson" },
  { key: "stickers",      label: "Stickers" },
  { key: "giftMessages",  label: "Gifts" },
];

function getItemImage(item) {
  if (item.sku === "gift-message") return item.design?.front || item.design?.back || null;
  if (item.design?.front)
    return createImage(item.colorName, item.styleCode, { url: item.design.front }, 400);
  if (item.design?.back)
    return createImage(item.colorName, item.styleCode, { url: item.design.back, side: "back" }, 400);
  return null;
}

function EmptyState({ label }) {
  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 12, gap: 1.5 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <InboxIcon sx={{ fontSize: 32, color: "#9ca3af" }} />
      </Box>
      <Typography variant="h6" fontWeight={700} color="text.disabled">
        No {label} pending
      </Typography>
      <Typography variant="body2" color="text.disabled">
        All caught up
      </Typography>
    </Box>
  );
}

function ItemCard({ item, station, sending, onSend, sendLabel, onMarkShipped, markingShipped, onPrintBarcode, printingBarcode }) {
  const img = getItemImage(item);
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.15s",
        "&:hover": onSend ? { boxShadow: "0 4px 16px rgba(0,0,0,0.1)" } : {},
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "#f5f5f5", flexShrink: 0 }}>
        {img ? (
          <Image src={img} alt={item.pieceId} fill style={{ objectFit: "contain", padding: 6 }} />
        ) : (
          <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="caption" color="text.disabled">No image</Typography>
          </Box>
        )}
        {sending && (
          <Box sx={{
            position: "absolute", inset: 0, bgcolor: "rgba(255,255,255,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CircularProgress size={36} />
          </Box>
        )}
      </Box>

      <CardContent sx={{ p: 1.5, pb: "12px !important", flexGrow: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
          <Typography sx={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", lineHeight: 1.2 }}>
            {item.pieceId}
          </Typography>
          <Chip label={item.styleCode} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 18 }} />
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.secondary", fontSize: "0.72rem" }}>
            {item.order?.poNumber}
          </Typography>
          {item.date && (
            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
              {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
          {item.colorName && (
            <Chip label={item.colorName} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
          )}
          {item.sizeName && (
            <Chip label={item.sizeName} size="small" sx={{ fontSize: "0.65rem", height: 18 }} />
          )}
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ mt: "auto", pt: 0.5 }}>
          {onSend && (
            <Button
              size="small"
              variant="contained"
              disabled={sending}
              onClick={onSend}
              sx={{ flex: 1, fontSize: "0.75rem", py: 0.5, minWidth: 0 }}
            >
              {sending ? <CircularProgress size={14} color="inherit" /> : (sendLabel || "Send")}
            </Button>
          )}
          <Link
            href={`/shipping?pieceId=${item.pieceId}&station=${station}`}
            target="_blank"
            style={{ flex: 1 }}
          >
            <Button size="small" variant="outlined" fullWidth sx={{ fontSize: "0.75rem", py: 0.5 }}>
              {item.order?.items?.length > 1 ? "Bin" : "Ship"}
            </Button>
          </Link>
        </Stack>
        <Button
          size="small"
          variant="outlined"
          color="success"
          fullWidth
          disabled={markingShipped}
          onClick={onMarkShipped}
          sx={{ fontSize: "0.7rem", py: 0.4, mt: 0.5 }}
        >
          {markingShipped ? <CircularProgress size={12} color="inherit" /> : "Mark Shipped"}
        </Button>
        <Button
          size="small"
          variant="outlined"
          fullWidth
          disabled={printingBarcode}
          onClick={onPrintBarcode}
          sx={{ fontSize: "0.7rem", py: 0.4, mt: 0.5, borderColor: "#6366f1", color: "#6366f1", "&:hover": { borderColor: "#4f46e5", bgcolor: "#eef2ff" } }}
        >
          {printingBarcode ? <CircularProgress size={12} color="inherit" /> : "Print Barcode"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function Main({ labels, station }) {
  const [tab, setTab] = useState(() => {
    const first = TABS.find(t => (labels[t.key]?.length || 0) > 0);
    return first?.key || "sublimation";
  });
  const [sending, setSending] = useState({});
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });
  const mark = (id, val) => setSending(p => ({ ...p, [id]: val }));

  const buttonGroups = useMemo(() => {
    const map = {};
    for (const item of labels.buttons || []) {
      const po = item.order?.poNumber || "unknown";
      if (!map[po]) map[po] = { poNumber: po, order: item.order, items: [] };
      map[po].items.push(item);
    }
    return Object.values(map);
  }, [labels.buttons]);

  const sendMug = async (item) => {
    mark(item._id, true);
    try {
      const { data } = await axios.post("/api/production/sublimation", { item });
      if (data?.error) showSnack(data.msg || "Send failed", "error");
      else showSnack(`Sent: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(item._id, false);
    }
  };

  const sendPoster = async (item) => {
    mark(item._id, true);
    try {
      const { data } = await axios.post("/api/production/sublimation/poster", {
        image: item.design?.front || item.design?.back,
        bgColor: item.colorName,
        size: item.sizeName,
        sku: item.pieceId,
      });
      if (data?.error) showSnack(data.msg || "Send failed", "error");
      else showSnack(`Poster queued: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(item._id, false);
    }
  };

  const sendButtonBatch = async (group) => {
    const key = `btn-${group.poNumber}`;
    mark(key, true);
    try {
      const { data } = await axios.post("/api/production/sublimation/buttons", {
        poNumber: group.poNumber,
        buttons: group.items.map(item => ({
          design_image: item.design?.front || item.design?.back,
          color: item.colorName,
          quantity: 1,
          size: item.sizeName,
        })),
      });
      if (data?.error) showSnack(data.msg || "Send failed", "error");
      else showSnack(`Buttons queued for ${group.poNumber}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(key, false);
    }
  };

  const sendGiftMessage = async (item) => {
    mark(item._id, true);
    try {
      const imageUrl = item.design?.front || item.design?.back;
      const { data } = await axios.post("/api/production/sublimation/print-image", {
        imageUrl, pieceId: item.pieceId, folder: "gift-messages",
      });
      if (data?.error) showSnack(data.msg || "Print failed", "error");
      else showSnack(`Gift message sent: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(item._id, false);
    }
  };

  const sendEpson = async (item) => {
    mark(item._id, true);
    try {
      const { data } = await axios.post("/api/production/sublimation/epson", { items: [item] });
      if (data?.error) showSnack(data.msg || "Send failed", "error");
      else showSnack(`Sent to Epson: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(item._id, false);
    }
  };

  const sendCreate = async (item) => {
    mark(item._id, true);
    try {
      const { data } = await axios.post("/api/production/sublimation/create", { item });
      if (data?.error) showSnack(data.msg || "Send failed", "error");
      else showSnack(`Sent: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(item._id, false);
    }
  };

  const reprintBarcode = async (item) => {
    mark(`barcode-${item._id}`, true);
    try {
      const { data } = await axios.post("/api/production/sublimation/reprint-barcode", { item });
      if (data?.error) showSnack(data.msg || "Print failed", "error");
      else showSnack(`Barcode sent: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(`barcode-${item._id}`, false);
    }
  };

  const markShipped = async (item) => {
    mark(`ship-${item._id}`, true);
    try {
      const { data } = await axios.post("/api/production/sublimation/mark-shipped", { pieceId: item.pieceId });
      if (data?.error) showSnack("Mark shipped failed", "error");
      else showSnack(`Marked shipped: ${item.pieceId}`);
    } catch {
      showSnack("Could not reach server", "error");
    } finally {
      mark(`ship-${item._id}`, false);
    }
  };

  const currentItems = labels[tab] || [];
  const currentTabLabel = TABS.find(t => t.key === tab)?.label ?? "";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: "#f0f2f5", overflowX: "hidden" }}>

      {/* ── Sticky tab bar ── */}
      <Paper
        elevation={0}
        square
        sx={{ position: "sticky", top: 0, zIndex: 10, bgcolor: "#fff", borderBottom: "1px solid #e5e7eb" }}
      >
        <Box
          sx={{
            display: "flex",
            overflowX: "auto",
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {TABS.map(t => {
            const count  = t.key === "buttons" ? buttonGroups.length : (labels[t.key]?.length || 0);
            const active = tab === t.key;
            return (
              <ButtonBase
                key={t.key}
                onClick={() => setTab(t.key)}
                sx={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 2.5,
                  py: 1.5,
                  borderBottom: "2.5px solid",
                  borderColor: active ? "#6366f1" : "transparent",
                  color: active ? "#6366f1" : "#6b7280",
                  transition: "all 0.15s",
                  "&:hover": {
                    bgcolor: "#f9fafb",
                    color: active ? "#6366f1" : "#374151",
                  },
                }}
              >
                <Typography sx={{ fontSize: "0.85rem", fontWeight: active ? 700 : 500, textTransform: "none", lineHeight: 1 }}>
                  {t.label}
                </Typography>
                {count > 0 && (
                  <Box sx={{
                    minWidth: 20,
                    height: 18,
                    px: 0.75,
                    bgcolor: active ? "#6366f1" : "#f3f4f6",
                    color: active ? "#fff" : "#9ca3af",
                    borderRadius: 10,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {count}
                  </Box>
                )}
              </ButtonBase>
            );
          })}
        </Box>
      </Paper>

      {/* ── Page content (flex:1 fills space so footer stays at bottom) ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, maxWidth: 1400, mx: "auto", width: "100%" }}>

        {/* ── Buttons tab: grouped by PO ── */}
        {tab === "buttons" && (
          buttonGroups.length === 0 ? (
            <EmptyState label="buttons" />
          ) : (
            <Stack spacing={2}>
              {buttonGroups.map(group => {
                const key = `btn-${group.poNumber}`;
                const allButtons = group.items.length >= (group.order?.items?.length || group.items.length);
                const shipPieceId = group.items[0]?.pieceId;
                return (
                  <Card key={group.poNumber} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Box sx={{
                      px: 2, py: 1.5,
                      display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap",
                      borderBottom: "1px solid #eee",
                    }}>
                      <Chip label={group.poNumber} color="warning" variant="outlined" sx={{ fontWeight: 700, fontFamily: "monospace" }} />
                      <Chip label={`${group.items.length} item${group.items.length !== 1 ? "s" : ""}`} size="small" variant="outlined" />
                      {group.items[0]?.date && (
                        <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.68rem" }}>
                          {new Date(group.items[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                      )}
                      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                        <Button variant="contained" size="small" disabled={!!sending[key]} onClick={() => sendButtonBatch(group)}>
                          {sending[key] ? <CircularProgress size={14} color="inherit" /> : "Reprint"}
                        </Button>
                        {shipPieceId && (
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={!!sending[`barcode-${group.items[0]?._id}`]}
                            onClick={() => reprintBarcode({ ...group.items[0], order: group.order })}
                            sx={{ borderColor: "#6366f1", color: "#6366f1", "&:hover": { borderColor: "#4f46e5", bgcolor: "#eef2ff" } }}
                          >
                            {sending[`barcode-${group.items[0]?._id}`] ? <CircularProgress size={14} color="inherit" /> : "Print Barcode"}
                          </Button>
                        )}
                        {shipPieceId && (
                          <Link href={`/shipping?pieceId=${shipPieceId}&station=${station}`} target="_blank">
                            <Button variant="outlined" size="small">{allButtons ? "Ship" : "Bin"}</Button>
                          </Link>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.5, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      {group.items.map(item => {
                        const img = getItemImage(item);
                        return (
                          <Box key={item._id} sx={{ textAlign: "center", width: 80 }}>
                            <Box sx={{ width: 80, height: 80, position: "relative", bgcolor: "#f5f5f5", borderRadius: 1, overflow: "hidden" }}>
                              {img
                                ? <Image src={img} alt={item.pieceId} fill style={{ objectFit: "contain" }} />
                                : <Box sx={{ height: "100%", bgcolor: "#eee" }} />
                              }
                            </Box>
                            <Typography variant="caption" display="block" sx={{ fontFamily: "monospace", fontSize: "0.62rem", mt: 0.25, lineHeight: 1.3 }}>
                              {item.pieceId}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.62rem" }}>
                              {item.colorName}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          )
        )}

        {/* ── All other tabs ── */}
        {tab !== "buttons" && (
          currentItems.length === 0 ? (
            <EmptyState label={currentTabLabel.toLowerCase()} />
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 1.5 }}>
              {[...currentItems].reverse().map(item => {
                const isMug    = MUG_CODES.includes(item.styleCode);
                const isPoster = item.styleCode === "POST";
                const isGift   = item.sku === "gift-message";
                const isEpson  = EPSON_CODES.includes(item.styleCode);
                const isCreate = !isMug && !isPoster && !isGift && !isEpson && CREATE_CODES.includes(item.styleCode);
                return (
                  <ItemCard
                    key={item._id}
                    item={item}
                    station={station}
                    sending={!!sending[item._id]}
                    onSend={
                      isMug    ? () => sendMug(item)         :
                      isPoster ? () => sendPoster(item)      :
                      isGift   ? () => sendGiftMessage(item) :
                      isEpson  ? () => sendEpson(item)       :
                      isCreate ? () => sendCreate(item)      :
                      null
                    }
                    sendLabel={
                      isMug    ? "Print Mug"       :
                      isPoster ? "Send to Printer" :
                      isGift   ? "Print"           :
                      isEpson  ? "Send to Epson"   :
                      isCreate ? "Send"            :
                      null
                    }
                    onMarkShipped={() => markShipped(item)}
                    markingShipped={!!sending[`ship-${item._id}`]}
                    onPrintBarcode={() => reprintBarcode(item)}
                    printingBarcode={!!sending[`barcode-${item._id}`]}
                  />
                );
              })}
            </Box>
          )
        )}
      </Box>

      <Footer fixed />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
