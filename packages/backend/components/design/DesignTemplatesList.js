"use client";
import {
  Box, Container, Typography, Stack, Chip, Button, Card,
  Grid2, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Divider,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BrushIcon from "@mui/icons-material/Brush";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

const PREV_W = 240;
const PREV_H = Math.round(560 * (PREV_W / 480));

function imgStyle(o, sx, sy) {
  const w = (o.width  || 480) * (o.scaleX || 1) * sx;
  const h = (o.height || 560) * (o.scaleY || 1) * sy;
  const cx = o.originX === "center";
  const cy = o.originY === "center";
  return {
    position: "absolute",
    left:  (o.left || 0) * sx - (cx ? w / 2 : 0),
    top:   (o.top  || 0) * sy - (cy ? h / 2 : 0),
    width:  w,
    height: h,
    pointerEvents: "none",
  };
}

function TemplatePreview({ canvasJson }) {
  if (!canvasJson) {
    return (
      <Box sx={{ width: PREV_W, height: PREV_H, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BrushIcon sx={{ color: "#cbd5e1", fontSize: 48 }} />
      </Box>
    );
  }

  const allObjects = canvasJson.objects || [];
  // Images may be canvas objects (new) or the legacy backgroundImage field (old saves)
  const imageObjs = allObjects.filter(o => o.type === "image" && o.src);
  const legacyBg  = !imageObjs.length && canvasJson.backgroundImage?.src
    ? [canvasJson.backgroundImage]
    : [];
  const allImages = [...imageObjs, ...legacyBg];

  const textObjs = allObjects.filter(o => ["i-text", "text", "textbox"].includes(o.type));
  const sx = PREV_W / 480;
  const sy = PREV_H / 560;

  const hasContent = allImages.length > 0 || textObjs.length > 0;

  return (
    <Box sx={{ position: "relative", width: PREV_W, height: PREV_H, overflow: "hidden", flexShrink: 0 }}>
      {!hasContent && (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BrushIcon sx={{ color: "#cbd5e1", fontSize: 48 }} />
        </Box>
      )}
      {allImages.map((o, i) => (
        <img key={i} src={o.src} alt="" style={imgStyle(o, sx, sy)} />
      ))}
      {textObjs.map((o, i) => {
        const fill = typeof o.fill === "string" ? o.fill : "#000000";
        const cx = o.originX === "center";
        const cy = o.originY === "center";
        const transforms = [
          cx ? "translateX(-50%)" : "",
          cy ? "translateY(-50%)" : "",
        ].filter(Boolean).join(" ");
        return (
          <Box key={i} component="span" sx={{
            position: "absolute",
            left:      (o.left || 0) * sx,
            top:       (o.top  || 0) * sy,
            transform: transforms || undefined,
            fontSize:  (o.fontSize || 24) * sx,
            color:     fill,
            fontFamily: o.fontFamily || "sans-serif",
            fontWeight: o.fontWeight || "normal",
            fontStyle:  o.fontStyle  || "normal",
            whiteSpace: "pre",
            lineHeight: 1.2,
            pointerEvents: "none",
            userSelect: "none",
            display: "block",
          }}>
            {o.text}
          </Box>
        );
      })}
    </Box>
  );
}

export function DesignTemplatesList({ templates: initial }) {
  const [templates, setTemplates] = useState(initial);
  const [delId, setDelId]         = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/design-templates?id=${delId}`);
      setTemplates(t => t.filter(x => x._id !== delId));
      setDelId(null);
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", minHeight: "90vh", background: "#f8fafc" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>

        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 42, height: 42, borderRadius: 2,
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,.35)",
            }}>
              <BrushIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>Design Templates</Typography>
                <Chip label={templates.length} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Reusable designs with customer-customizable text fields
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained" startIcon={<AddIcon />} href="/admin/design-template/new"
            sx={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", "&:hover": { background: "#6d28d9" }, px: 2.5, borderRadius: 2 }}
          >
            New Template
          </Button>
        </Box>

        {/* Empty state */}
        {templates.length === 0 && (
          <Box sx={{ textAlign: "center", py: 14, background: "#fff", borderRadius: 3, border: "2px dashed #e2e8f0" }}>
            <BrushIcon sx={{ fontSize: 56, color: "#cbd5e1", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" mb={1}>No templates yet</Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>
              Create a template to start building customizable designs
            </Typography>
            <Button
              variant="contained" href="/admin/design-template/new" startIcon={<AddIcon />}
              sx={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}
            >
              Create First Template
            </Button>
          </Box>
        )}

        {/* Grid */}
        <Grid2 container spacing={2.5}>
          {templates.map(t => (
            <Grid2 key={t._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{
                borderRadius: 3, overflow: "hidden",
                border: "1px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(0,0,0,.06)",
                transition: "box-shadow .15s, transform .15s",
                "&:hover": { boxShadow: "0 8px 28px rgba(0,0,0,.12)", transform: "translateY(-2px)" },
                display: "flex", flexDirection: "column",
              }}>

                {/* Canvas preview */}
                <Box sx={{
                  background: "repeating-conic-gradient(#f1f5f9 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  minHeight: PREV_H, overflow: "hidden",
                }}>
                  <TemplatePreview canvasJson={t.canvasJson} />
                </Box>

                {/* Info */}
                <Box sx={{ p: 1.75, flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography fontWeight={700} sx={{ fontSize: "0.875rem", lineHeight: 1.3, flex: 1, mr: 0.5 }}>
                      {t.name}
                    </Typography>
                    <Stack direction="row" spacing={0.25} flexShrink={0}>
                      <Tooltip title="Edit template">
                        <IconButton size="small" href={`/admin/design-template/${t._id}`} sx={{ color: "#7c3aed" }}>
                          <EditIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => setDelId(t._id)}>
                          <DeleteIcon sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  {(t.customizableFields || []).length > 0 ? (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(t.customizableFields || []).map(f => (
                        <Chip
                          key={f.id} label={f.label} size="small"
                          icon={<AutoAwesomeIcon sx={{ fontSize: "11px !important" }} />}
                          sx={{ fontSize: "0.65rem", height: 20, background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe" }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: "italic" }}>
                      No customizable fields
                    </Typography>
                  )}

                  {(t.printType || []).length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {(Array.isArray(t.printType) ? t.printType : [t.printType]).map(pt => (
                        <Chip key={pt} label={pt} size="small"
                          sx={{ fontSize: "0.6rem", height: 18, background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }} />
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 0.25 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.disabled">
                      {new Date(t.updatedAt || t.createdAt).toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={t.active !== false ? "Active" : "Inactive"}
                      size="small"
                      color={t.active !== false ? "success" : "default"}
                      variant="outlined"
                      sx={{ fontSize: "0.62rem", height: 18 }}
                    />
                  </Stack>
                </Box>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      </Container>

      {/* Delete confirmation */}
      <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Template?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            This cannot be undone. Products using this template will lose their customizer.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDelId(null)} disabled={deleting}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
