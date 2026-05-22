"use client";
import {
  Box, Stack, TextField, Button, Typography, Divider, Switch,
  FormControlLabel, Select, MenuItem, InputLabel, FormControl,
  Chip, IconButton, Tooltip, Paper, Alert, Snackbar, CircularProgress,
} from "@mui/material";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const CANVAS_W = 480;
const CANVAS_H = 560;
const FONTS = [
  { label: "Bebas Neue",       value: "Bebas Neue" },
  { label: "Anton",            value: "Anton" },
  { label: "Oswald",          value: "Oswald" },
  { label: "Montserrat",       value: "Montserrat" },
  { label: "Raleway",         value: "Raleway" },
  { label: "Playfair Display", value: "Playfair Display" },
  { label: "Dancing Script",  value: "Dancing Script" },
  { label: "Pacifico",        value: "Pacifico" },
  { label: "Permanent Marker", value: "Permanent Marker" },
  { label: "Arial",           value: "Arial" },
  { label: "Georgia",         value: "Georgia" },
  { label: "Impact",          value: "Impact" },
  { label: "Times New Roman", value: "Times New Roman" },
];

function genId() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function DesignTemplateEditor({ templateId, apiBase = "/api/admin/design-templates" }) {
  const fabricRef = useRef(null);
  const fileInputRef = useRef(null);
  const bgFileRef = useRef(null);
  const historyRef = useRef([]);
  const histIdxRef = useRef(-1);
  const histPausedRef = useRef(false);
  const customFieldsRef = useRef([]); // keeps in sync with state for callbacks

  const [fabricLoaded, setFabricLoaded] = useState(false);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!templateId && templateId !== "new");
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "success" });

  // Selection state
  const [selType, setSelType] = useState(null); // "text" | "image" | null
  const [selObjRef, setSelObjRef] = useState(null);

  // Text props (mirror of selected object)
  const [fontFamily, setFontFamily] = useState("Montserrat");
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState("#000000");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState("left");
  const [imgOpacity, setImgOpacity] = useState(100);

  // Customizable field state (for the currently selected text obj)
  const [isCustomizable, setIsCustomizable] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldPlaceholder, setFieldPlaceholder] = useState("");
  const [fieldMaxLength, setFieldMaxLength] = useState(50);
  const [fieldRequired, setFieldRequired] = useState(false);

  // All defined customizable fields
  const [customFields, setCustomFields] = useState([]);

  // OCR state
  const ocrImageRef = useRef(null); // { url, naturalWidth, naturalHeight }
  const [hasOcrImage, setHasOcrImage] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ── Load Fabric.js ────────────────────────────────────────────────────────
  useEffect(() => {
    let active = true; // prevent stale init if effect re-runs (Strict Mode)

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Anton&family=Oswald:wght@400;600&family=Montserrat:ital,wght@0,400;0,700;1,400&family=Raleway:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@700&family=Pacifico&family=Permanent+Marker&display=swap";
    document.head.appendChild(link);

    const doInit = () => {
      if (!active) return;
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
      initCanvas();
    };

    // Load Tesseract.js for pixel-accurate OCR bounding boxes
    if (!window.Tesseract) {
      const ts = document.createElement("script");
      ts.src = "https://unpkg.com/tesseract.js@4/dist/tesseract.min.js";
      ts.async = true;
      document.head.appendChild(ts);
    }

    if (window.fabric) {
      doInit();
    } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
      s.onload = () => { if (active) { setFabricLoaded(true); doInit(); } };
      document.head.appendChild(s);
    }

    return () => {
      active = false;
      try { document.head.removeChild(link); } catch {}
      if (fabricRef.current) { fabricRef.current.dispose(); fabricRef.current = null; }
    };
  }, []);

  function initCanvas() {
    const F = window.fabric;
    const c = new F.Canvas("dt-canvas", {
      width: CANVAS_W, height: CANVAS_H,
      preserveObjectStacking: true,
      backgroundColor: "#ffffff",
    });
    fabricRef.current = c;

    c.on("selection:created", handleSelect);
    c.on("selection:updated", handleSelect);
    c.on("selection:cleared", handleDeselect);
    c.on("object:modified", pushHistory);
    c.on("object:added", pushHistory);
    c.on("object:removed", pushHistory);

    pushHistory();

    if (templateId && templateId !== "new") loadTemplate(c);
  }

  async function loadTemplate(c) {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBase}?id=${templateId}`);
      const t = res.data.template;
      setTemplateName(t.name || "Untitled Template");
      const fields = t.customizableFields || [];
      setCustomFields(fields);
      customFieldsRef.current = fields;

      // Strip expired blob: URLs — Fabric never calls its callback when an image
      // src fails to load, which hangs the canvas indefinitely.
      const json = t.canvasJson ? JSON.parse(JSON.stringify(t.canvasJson)) : {};
      if (json.backgroundImage?.src?.startsWith?.("blob:")) {
        delete json.backgroundImage;
      }
      json.objects = (json.objects ?? []).map(o => {
        if (o.src?.startsWith?.("blob:")) return { ...o, src: "" };
        return o;
      });

      await new Promise(resolve => {
        // Safety timeout — resolve after 10 s even if Fabric never fires the callback
        const timer = setTimeout(() => { c.renderAll(); resolve(); }, 10000);
        c.loadFromJSON(json, () => {
          clearTimeout(timer);
          c.renderAll();
          resolve();
        });
      });
      pushHistory();
    } catch (e) {
      showSnack("Failed to load template: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── History ───────────────────────────────────────────────────────────────
  function pushHistory() {
    if (histPausedRef.current || !fabricRef.current) return;
    const json = fabricRef.current.toJSON(["fieldId", "isCustomizable", "defaultValue"]);
    const hist = historyRef.current.slice(0, histIdxRef.current + 1);
    hist.push(json);
    historyRef.current = hist;
    histIdxRef.current = hist.length - 1;
  }

  function undo() {
    if (histIdxRef.current <= 0 || !fabricRef.current) return;
    histIdxRef.current--;
    histPausedRef.current = true;
    fabricRef.current.loadFromJSON(historyRef.current[histIdxRef.current], () => {
      fabricRef.current.renderAll();
      histPausedRef.current = false;
      handleDeselect();
    });
  }

  function redo() {
    const hist = historyRef.current;
    if (histIdxRef.current >= hist.length - 1 || !fabricRef.current) return;
    histIdxRef.current++;
    histPausedRef.current = true;
    fabricRef.current.loadFromJSON(hist[histIdxRef.current], () => {
      fabricRef.current.renderAll();
      histPausedRef.current = false;
      handleDeselect();
    });
  }

  // ── Selection handlers ────────────────────────────────────────────────────
  const handleSelect = useCallback(() => {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    const isText = ["i-text", "text", "textbox"].includes(obj.type);
    const isImg  = obj.type === "image";
    setSelObjRef(obj);
    setSelType(isText ? "text" : isImg ? "image" : null);

    if (isText) {
      setFontFamily(obj.fontFamily || "Montserrat");
      setFontSize(Math.round(obj.fontSize || 48));
      setTextColor(obj.fill || "#000000");
      setIsBold(obj.fontWeight === "bold");
      setIsItalic(obj.fontStyle === "italic");
      setTextAlign(obj.textAlign || "left");
      const isCust = !!obj.isCustomizable;
      setIsCustomizable(isCust);
      if (isCust && obj.fieldId) {
        const f = customFieldsRef.current.find(x => x.id === obj.fieldId);
        if (f) {
          setFieldLabel(f.label);
          setFieldPlaceholder(f.placeholder);
          setFieldMaxLength(f.maxLength);
          setFieldRequired(f.required);
        }
      } else {
        setFieldLabel(""); setFieldPlaceholder(""); setFieldMaxLength(50); setFieldRequired(false);
      }
    }
    if (isImg) setImgOpacity(Math.round((obj.opacity ?? 1) * 100));
  }, []);

  const handleDeselect = useCallback(() => {
    setSelObjRef(null); setSelType(null); setIsCustomizable(false);
  }, []);

  // ── Text property helpers ─────────────────────────────────────────────────
  function applyText(prop, val) {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;
    obj.set(prop, val);
    fabricRef.current.renderAll();
  }

  function toggleBold() {
    const nb = !isBold; setIsBold(nb); applyText("fontWeight", nb ? "bold" : "normal");
  }
  function toggleItalic() {
    const ni = !isItalic; setIsItalic(ni); applyText("fontStyle", ni ? "italic" : "normal");
  }

  // ── Make Customizable toggle ──────────────────────────────────────────────
  function handleCustomizableToggle(checked) {
    setIsCustomizable(checked);
    const obj = fabricRef.current?.getActiveObject();
    if (!obj) return;

    if (checked) {
      const id = obj.fieldId || genId();
      const defVal = obj.text || "";
      obj.set({
        fieldId: id,
        isCustomizable: true,
        defaultValue: defVal,
      });
      fabricRef.current.renderAll();

      const label = fieldLabel || "Custom Text";
      const newField = {
        id,
        label,
        placeholder: fieldPlaceholder || "Enter text",
        defaultValue: defVal,
        maxLength: fieldMaxLength,
        required: fieldRequired,
      };
      setCustomFields(prev => {
        const updated = prev.filter(f => f.id !== id).concat(newField);
        customFieldsRef.current = updated;
        return updated;
      });
      setFieldLabel(label);
    } else {
      const id = obj.fieldId;
      obj.set({ fieldId: null, isCustomizable: false, defaultValue: undefined });
      fabricRef.current.renderAll();
      setCustomFields(prev => {
        const updated = prev.filter(f => f.id !== id);
        customFieldsRef.current = updated;
        return updated;
      });
    }
  }

  function syncFieldMeta() {
    const obj = fabricRef.current?.getActiveObject();
    if (!obj?.fieldId) return;
    setCustomFields(prev => {
      const updated = prev.map(f => f.id === obj.fieldId
        ? { ...f, label: fieldLabel, placeholder: fieldPlaceholder, maxLength: fieldMaxLength, required: fieldRequired }
        : f
      );
      customFieldsRef.current = updated;
      return updated;
    });
  }

  function removeField(id) {
    const c = fabricRef.current;
    if (c) {
      c.getObjects().filter(o => o.fieldId === id).forEach(o => {
        o.set({ fieldId: null, isCustomizable: false, defaultValue: undefined, stroke: null, strokeWidth: 0 });
      });
      c.renderAll();
    }
    setCustomFields(prev => {
      const updated = prev.filter(f => f.id !== id);
      customFieldsRef.current = updated;
      return updated;
    });
    if (selObjRef?.fieldId === id) setIsCustomizable(false);
  }

  // ── Canvas tools ──────────────────────────────────────────────────────────
  function addText() {
    const F = window.fabric;
    const t = new F.IText("Double-click to edit", {
      left: CANVAS_W / 2, top: CANVAS_H / 2,
      originX: "center", originY: "center",
      fontSize: 48, fontFamily: "Montserrat",
      fill: "#000000", textAlign: "center",
    });
    fabricRef.current?.add(t);
    fabricRef.current?.setActiveObject(t);
    fabricRef.current?.renderAll();
  }

  function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      window.fabric.Image.fromURL(url, img => {
        ocrImageRef.current = { url, naturalWidth: img.width, naturalHeight: img.height, fabricObj: img };
        setHasOcrImage(true);
        const maxDim = Math.min(CANVAS_W, CANVAS_H) * 0.7;
        if (img.width > maxDim || img.height > maxDim) {
          img.width > img.height ? img.scaleToWidth(maxDim) : img.scaleToHeight(maxDim);
        }
        img.set({
          left: CANVAS_W / 2, top: CANVAS_H / 2,
          originX: "center", originY: "center",
          selectable: true, evented: true,
          hasControls: true, hasBorders: true,
        });
        fabricRef.current?.add(img);
        fabricRef.current?.setActiveObject(img);
        fabricRef.current?.renderAll();
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleBgFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const url = ev.target.result;
      window.fabric.Image.fromURL(url, img => {
        const scale  = Math.min(CANVAS_W / img.width, CANVAS_H / img.height);
        const bgLeft = Math.round((CANVAS_W - img.width  * scale) / 2);
        const bgTop  = Math.round((CANVAS_H - img.height * scale) / 2);
        ocrImageRef.current = { url, naturalWidth: img.width, naturalHeight: img.height, fabricObj: null, bgLeft, bgTop };
        setHasOcrImage(true);
        fabricRef.current?.setBackgroundImage(img, fabricRef.current.renderAll.bind(fabricRef.current), {
          scaleX: scale, scaleY: scale, left: bgLeft, top: bgTop, originX: "left", originY: "top",
        });
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function extractTextFromImage() {
    const ocr = ocrImageRef.current;
    if (!ocr || ocrProcessing) return;
    setOcrProcessing(true);
    try {
      const F = window.fabric;
      const nW = ocr.naturalWidth, nH = ocr.naturalHeight;

      // Read the exact position/scale of the current background from the canvas
      // so the new background lands in the exact same spot after extraction.
      const currentBg  = fabricRef.current?.backgroundImage;
      // Also check for an image canvas object (if uploaded via Add Image instead of Set Background)
      const imgObj     = !currentBg ? (fabricRef.current?.getObjects("image")?.[0] ?? null) : null;
      const srcObj     = currentBg ?? imgObj;

      const defaultScale = Math.min(CANVAS_W / nW, CANVAS_H / nH);
      const bgSX = srcObj?.scaleX ?? defaultScale;
      const bgSY = srcObj?.scaleY ?? defaultScale;
      const uniformScale = bgSX;

      // If position came from a centered canvas object, convert center-origin to top-left
      let bgLeft, bgTop;
      if (imgObj && imgObj.originX === "center") {
        bgLeft = Math.round(imgObj.left - (nW * bgSX) / 2);
        bgTop  = Math.round(imgObj.top  - (nH * bgSY) / 2);
      } else {
        bgLeft = srcObj?.left ?? Math.round((CANVAS_W - nW * bgSX) / 2);
        bgTop  = srcObj?.top  ?? Math.round((CANVAS_H - nH * bgSY) / 2);
      }

      const fontStyleMap = {
        display:      "Bebas Neue",
        "sans-serif": "Montserrat",
        serif:        "Playfair Display",
        script:       "Dancing Script",
        handwritten:  "Permanent Marker",
      };

      // ── Sample background color ──────────────────────────────────────────
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = nW; srcCanvas.height = nH;
      const sctx = srcCanvas.getContext("2d");
      sctx.fillStyle = "#ffffff";
      sctx.fillRect(0, 0, nW, nH);
      await new Promise(resolve => {
        const img = new Image(); img.onload = () => { sctx.drawImage(img, 0, 0); resolve(); };
        img.src = ocr.url;
      });
      const bgPts = [[0,0],[nW-1,0],[0,nH-1],[nW-1,nH-1],[Math.floor(nW/2),0],[Math.floor(nW/2),nH-1],[0,Math.floor(nH/2)],[nW-1,Math.floor(nH/2)]];
      let bgR=0,bgG=0,bgB=0;
      for(const [x,y] of bgPts){ const d=sctx.getImageData(x,y,1,1).data; bgR+=d[0];bgG+=d[1];bgB+=d[2]; }
      bgR=Math.round(bgR/bgPts.length); bgG=Math.round(bgG/bgPts.length); bgB=Math.round(bgB/bgPts.length);
      if (bgR < 40 && bgG < 40 && bgB < 40) { bgR = 255; bgG = 255; bgB = 255; }
      const bgHex = `#${bgR.toString(16).padStart(2,"0")}${bgG.toString(16).padStart(2,"0")}${bgB.toString(16).padStart(2,"0")}`;

      // ── Run Tesseract (positions) + GPT-4o (styles) in parallel ─────────
      const tessPromise = window.Tesseract
        ? window.Tesseract.recognize(ocr.url, "eng", { logger: () => {} }).then(r => r.data).catch(() => null)
        : Promise.resolve(null);

      const gptPromise = fetch(`${apiBase}/extract-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: ocr.url }),
      }).then(r => r.json());

      const [tessData, extractData] = await Promise.all([tessPromise, gptPromise]);

      if (extractData.error) throw new Error(extractData.msg);
      const gptBlocks = extractData.blocks ?? [];
      if (gptBlocks.length === 0) { showSnack("No text found in image", "info"); return; }

      // ── Parse Tesseract lines ────────────────────────────────────────────
      const normText = s => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
      const tessLines = (tessData?.lines ?? [])
        .filter(l => l.confidence > 50 && normText(l.text).length > 0)
        .map(l => ({
          text: l.text.trim(),
          x0: l.bbox.x0, y0: l.bbox.y0,
          bw: l.bbox.x1 - l.bbox.x0,
          bh: l.bbox.y1 - l.bbox.y0,
        }));

      // ── Merge: Tesseract position + GPT-4o style ─────────────────────────
      const textLayers = gptBlocks.map(b => {
        const bNorm = normText(b.text);
        const tMatch = tessLines.find(t => {
          const tNorm = normText(t.text);
          return tNorm === bNorm || tNorm.includes(bNorm) || bNorm.includes(tNorm);
        });

        let x0, y0, bw, bh;
        if (tMatch) {
          x0 = tMatch.x0; y0 = tMatch.y0; bw = tMatch.bw; bh = tMatch.bh;
        } else {
          // GPT-4o fallback — correct for its bottom-edge y_pct bias
          x0 = b.x_pct * nW;
          y0 = (b.y_pct - b.h_pct) * nH;
          bw = b.w_pct * nW;
          bh = b.h_pct * nH;
        }

        const fontSize = Math.max(12, Math.round(bh * uniformScale * 1.3));
        const fontFamily = fontStyleMap[b.font_style] ?? "Montserrat";
        return { text: b.text, fill: b.color_hex || "#000000", x0, y0, bw, bh, fontSize, fontFamily, isBold: b.is_bold, isItalic: b.is_italic };
      });

      // ── Build Tesseract-precise mask for Stability AI ────────────────────
      // WHITE = inpaint (text areas), BLACK = keep (everything else)
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = nW; maskCanvas.height = nH;
      const mctx = maskCanvas.getContext("2d");
      mctx.fillStyle = "#000000";
      mctx.fillRect(0, 0, nW, nH);
      for (const line of tessLines) {
        const pad = Math.ceil(line.bh * 0.08);
        mctx.fillStyle = "#ffffff";
        mctx.fillRect(
          Math.max(0, line.x0 - pad), Math.max(0, line.y0 - pad),
          Math.min(nW, line.bw + pad * 2), Math.min(nH, line.bh + pad * 2),
        );
      }

      // ── Erase text + remove background → transparent ball PNG ───────────
      const MAX_AI = 1024;
      const aiScale = Math.min(1, MAX_AI / Math.max(nW, nH));
      const aiW = Math.round(nW * aiScale);
      const aiH = Math.round(nH * aiScale);
      function resizedBlob(sourceCanvas) {
        const rc = document.createElement("canvas");
        rc.width = aiW; rc.height = aiH;
        rc.getContext("2d").drawImage(sourceCanvas, 0, 0, aiW, aiH);
        return new Promise(res => rc.toBlob(res, "image/png"));
      }

      // Helper: draw a source image (by URL) onto a CANVAS_W×CANVAS_H canvas at
      // the correct bgLeft/bgTop/uniformScale position → returns a small data URL
      // that persists across sessions (no blob: URLs in saved JSON).
      async function buildCanvasSizedDataUrl(srcUrl) {
        const cs = document.createElement("canvas");
        cs.width = CANVAS_W; cs.height = CANVAS_H;
        const ctx = cs.getContext("2d");
        await new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, bgLeft, bgTop, Math.round(nW * uniformScale), Math.round(nH * uniformScale));
            resolve();
          };
          img.src = srcUrl;
        });
        return cs.toDataURL("image/png");
      }

      let bgUrl = null;
      try {
        const [imageBlob, maskBlob] = await Promise.all([resizedBlob(srcCanvas), resizedBlob(maskCanvas)]);
        const fd = new FormData();
        fd.append("image", imageBlob, "image.png");
        fd.append("mask",  maskBlob,  "mask.png");
        const rebuildRes  = await fetch(`${apiBase}/rebuild-background`, { method: "POST", body: fd });
        const rebuildData = await rebuildRes.json();
        if (!rebuildData.error) {
          bgUrl = await buildCanvasSizedDataUrl(rebuildData.image);
        } else {
          console.warn("[rebuild-bg]", rebuildData.msg);
        }
      } catch (e) {
        console.warn("[rebuild-bg] failed, using original:", e.message);
      }

      // Fallback: render the original image at canvas size
      if (!bgUrl) bgUrl = await buildCanvasSizedDataUrl(ocr.url);

      // ── Set canvas-sized background (scale=1, pos=(0,0)) + IText layers ──
      const addedCount = await new Promise(resolve => {
        F.Image.fromURL(bgUrl, img => {
          (fabricRef.current?.getObjects("image") ?? []).forEach(o => fabricRef.current.remove(o));
          fabricRef.current?.setBackgroundImage(img, () => {
            let count = 0;
            for (const layer of textLayers) {
              // Text coords are already in canvas space (bgLeft/bgTop baked into buildCanvasSizedDataUrl)
              const textLeft = bgLeft + layer.x0 * uniformScale;
              const textTop  = bgTop  + layer.y0 * uniformScale;
              const availableW   = CANVAS_W - textLeft;
              const textWidthEst = layer.text.length * layer.fontSize * 0.65;
              const fontScale    = textWidthEst > availableW ? availableW / textWidthEst : 1;
              fabricRef.current.add(new F.IText(layer.text, {
                left: Math.max(0, textLeft), top: Math.max(0, textTop),
                fontSize:   Math.round(layer.fontSize * fontScale),
                fontFamily: layer.fontFamily,
                fontWeight: layer.isBold ? "bold" : "normal",
                fontStyle:  layer.isItalic ? "italic" : "normal",
                fill: layer.fill,
                textAlign: "left",
                selectable: true, evented: true,
              }));
              count++;
            }
            fabricRef.current?.discardActiveObject();
            fabricRef.current?.renderAll();
            resolve(count);
          }, { scaleX: 1, scaleY: 1, left: 0, top: 0, originX: "left", originY: "top" });
        });
      });

      ocrImageRef.current = { url: bgUrl, naturalWidth: CANVAS_W, naturalHeight: CANVAS_H, fabricObj: null, bgLeft: 0, bgTop: 0 };
      showSnack(`Extracted ${addedCount} text block${addedCount !== 1 ? "s" : ""}`, "success");
    } catch (e) {
      showSnack("OCR failed: " + (e?.message || String(e)), "error");
    } finally {
      setOcrProcessing(false);
    }
  }

  function trimTransparentPixels(srcDataUrl) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const tmp = document.createElement("canvas");
        tmp.width = img.width; tmp.height = img.height;
        const ctx = tmp.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
        let minX = width, minY = height, maxX = 0, maxY = 0;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (data[(y * width + x) * 4 + 3] > 0) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < minX || maxY < minY) { resolve(srcDataUrl); return; }
        const out = document.createElement("canvas");
        out.width = maxX - minX + 1;
        out.height = maxY - minY + 1;
        out.getContext("2d").drawImage(tmp, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
        resolve(out.toDataURL("image/png"));
      };
      img.src = srcDataUrl;
    });
  }

  async function exportToDesign() {
    const c = fabricRef.current;
    if (!c) return;
    setExporting(true);
    try {
      c.discardActiveObject();
      // Strip any strokes (customizable-field indicator) so they don't appear in the exported image
      c.getObjects().forEach(o => { if (o.stroke) o.set({ stroke: null, strokeWidth: 0 }); });
      const prevBg = c.backgroundColor;
      c.backgroundColor = "";
      c.renderAll();
      const raw = c.toDataURL({ format: "png", multiplier: 1 });
      c.backgroundColor = prevBg;
      c.renderAll();
      const dataUrl = await trimTransparentPixels(raw);
      const res = await fetch(`${apiBase}/create-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, name: templateName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.msg);
      window.location.href = `/admin/design/${data.design._id}`;
    } catch (e) {
      showSnack("Export failed: " + (e?.message || String(e)), "error");
      setExporting(false);
    }
  }

  async function downloadCanvas() {
    const c = fabricRef.current;
    if (!c) return;

    // Try Fabric's built-in export with transparent background
    try {
      c.discardActiveObject();
      const prevBg = c.backgroundColor;
      c.backgroundColor = "";
      c.renderAll();
      const dataUrl = c.toDataURL({ format: "png", multiplier: 1 });
      c.backgroundColor = prevBg;
      c.renderAll();
      if (!dataUrl.startsWith("data:image/png") || dataUrl.length < 100) throw new Error("empty");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${templateName || "design"}.png`;
      a.click();
      return;
    } catch {}

    // Fallback: manually composite background image + canvas objects (no bg fill = transparent)
    const out = document.createElement("canvas");
    out.width = CANVAS_W;
    out.height = CANVAS_H;
    const ctx = out.getContext("2d");
    // intentionally no fillRect — transparent background

    // Draw background image if present
    const bg = c.backgroundImage;
    if (bg?.getElement()) {
      const el = bg.getElement();
      const sx = bg.scaleX ?? 1;
      const sy = bg.scaleY ?? 1;
      ctx.drawImage(el, bg.left ?? 0, bg.top ?? 0, el.naturalWidth * sx, el.naturalHeight * sy);
    }

    // Render each canvas object by temporarily exporting just that object
    for (const obj of c.getObjects()) {
      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = CANVAS_W;
      tmpCanvas.height = CANVAS_H;
      const tmpFabric = new window.fabric.StaticCanvas(tmpCanvas);
      await new Promise(resolve => {
        tmpFabric.loadFromJSON({ objects: [obj.toJSON(["fieldId","isCustomizable","defaultValue"])] }, () => {
          tmpFabric.renderAll();
          resolve();
        });
      });
      ctx.drawImage(tmpCanvas, 0, 0);
      tmpFabric.dispose();
    }

    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = `${templateName || "design"}.png`;
    a.click();
  }

  function deleteSelected() {
    const c = fabricRef.current;
    if (!c) return;
    c.getActiveObjects().forEach(o => {
      if (o.fieldId) removeField(o.fieldId);
      else c.remove(o);
    });
    c.discardActiveObject(); c.renderAll();
  }

  function bringForward() { fabricRef.current?.getActiveObject()?.bringForward(); fabricRef.current?.renderAll(); }
  function sendBackward() { fabricRef.current?.getActiveObject()?.sendBackwards(); fabricRef.current?.renderAll(); }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save() {
    const c = fabricRef.current;
    if (!c) return;
    setSaving(true);
    try {
      const canvasJson = c.toJSON(["fieldId", "isCustomizable", "defaultValue"]);
      const payload = {
        name: templateName,
        canvasJson,
        customizableFields: customFieldsRef.current,
        canvasWidth: CANVAS_W,
        canvasHeight: CANVAS_H,
      };
      if (templateId && templateId !== "new") {
        await axios.put(`${apiBase}?id=${templateId}`, payload);
        showSnack("Template saved!", "success");
      } else {
        const res = await axios.post(apiBase, payload);
        showSnack("Template created!", "success");
        if (res.data.template?._id) {
          window.history.replaceState({}, "", window.location.pathname.replace("new", res.data.template._id));
        }
      }
    } catch (e) {
      showSnack("Save failed: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  }

  function showSnack(msg, sev = "success") {
    setSnack({ open: true, msg, sev });
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Z")) { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────
  const tbBtn = (label, icon, onClick, active = false, disabled = false) => (
    <Tooltip title={label}>
      <span>
        <Button size="small" variant={active ? "contained" : "outlined"} onClick={onClick}
          disabled={disabled} sx={{ minWidth: 36, px: 0.5, py: 0.5, fontSize: "0.75rem" }}>
          {icon}
        </Button>
      </span>
    </Tooltip>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center", gap: 2, background: "#fff" }}>
        <TextField
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          variant="standard"
          placeholder="Template name"
          inputProps={{ style: { fontWeight: 700, fontSize: "1rem" } }}
          sx={{ flex: 1, maxWidth: 400 }}
        />
        <Stack direction="row" spacing={1} ml="auto">
          <Button variant="outlined" size="small" onClick={() => window.location.href = "../design-templates"}>Back</Button>
          <Button variant="outlined" size="small" onClick={downloadCanvas}>Download</Button>
          <Button variant="outlined" size="small" onClick={exportToDesign} disabled={exporting}
            startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{ borderColor: "#7c3aed", color: "#7c3aed", "&:hover": { borderColor: "#6d28d9", background: "#f5f3ff" } }}>
            {exporting ? "Creating…" : "Create Design →"}
          </Button>
          <Button variant="contained" size="small" onClick={save} disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
            {saving ? "Saving…" : "Save Template"}
          </Button>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: "260px 1fr 260px", overflow: "hidden" }}>

        {/* Left: Text/Image properties + customizable settings */}
        <Box sx={{ borderRight: "1px solid", borderColor: "divider", overflowY: "auto", p: 2, background: "#fafafa" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Properties</Typography>

          {selType === "text" && (
            <Stack spacing={1.5}>
              <FormControl size="small" fullWidth>
                <InputLabel>Font</InputLabel>
                <Select label="Font" value={fontFamily} onChange={e => { setFontFamily(e.target.value); applyText("fontFamily", e.target.value); }}>
                  {FONTS.map(f => <MenuItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</MenuItem>)}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={1}>
                <TextField label="Size" type="number" size="small" value={fontSize}
                  onChange={e => { const v = +e.target.value; setFontSize(v); applyText("fontSize", v); }}
                  inputProps={{ min: 6, max: 400 }} sx={{ width: 80 }} />
                <input type="color" value={textColor}
                  onChange={e => { setTextColor(e.target.value); applyText("fill", e.target.value); }}
                  style={{ width: 44, height: 40, padding: 2, border: "1px solid #e0e0e0", borderRadius: 6, cursor: "pointer" }} />
              </Stack>

              <Stack direction="row" spacing={0.5}>
                {tbBtn("Bold", <b>B</b>, toggleBold, isBold)}
                {tbBtn("Italic", <i>I</i>, toggleItalic, isItalic)}
                {tbBtn("Left", "⬤", () => { setTextAlign("left"); applyText("textAlign", "left"); }, textAlign === "left")}
                {tbBtn("Center", "⬤", () => { setTextAlign("center"); applyText("textAlign", "center"); }, textAlign === "center")}
                {tbBtn("Right", "⬤", () => { setTextAlign("right"); applyText("textAlign", "right"); }, textAlign === "right")}
              </Stack>

              <Divider />

              {/* Make Customizable */}
              <Box sx={{ p: 1.5, borderRadius: 2, border: "2px solid", borderColor: isCustomizable ? "#f59e0b" : "divider",
                background: isCustomizable ? "#fffbeb" : "transparent", transition: ".15s" }}>
                <FormControlLabel
                  control={<Switch checked={isCustomizable} onChange={e => handleCustomizableToggle(e.target.checked)} size="small" color="warning" />}
                  label={<Typography variant="body2" fontWeight={700}>Customer Can Edit This</Typography>}
                />
                {isCustomizable && (
                  <Stack spacing={1} mt={1}>
                    <TextField label="Field label" size="small" value={fieldLabel}
                      onChange={e => setFieldLabel(e.target.value)}
                      onBlur={syncFieldMeta}
                      placeholder="e.g. Recipient Name" />
                    <TextField label="Placeholder" size="small" value={fieldPlaceholder}
                      onChange={e => setFieldPlaceholder(e.target.value)}
                      onBlur={syncFieldMeta}
                      placeholder="e.g. Enter name here" />
                    <TextField label="Max characters" type="number" size="small" value={fieldMaxLength}
                      onChange={e => { setFieldMaxLength(+e.target.value); syncFieldMeta(); }}
                      inputProps={{ min: 1, max: 200 }} />
                    <FormControlLabel
                      control={<Switch checked={fieldRequired} size="small"
                        onChange={e => { setFieldRequired(e.target.checked); syncFieldMeta(); }} />}
                      label={<Typography variant="caption">Required</Typography>}
                    />
                  </Stack>
                )}
              </Box>
            </Stack>
          )}

          {selType === "image" && (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">Opacity</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <input type="range" min={0} max={100} value={imgOpacity}
                  onChange={e => {
                    const v = +e.target.value; setImgOpacity(v);
                    fabricRef.current?.getActiveObject()?.set("opacity", v / 100);
                    fabricRef.current?.renderAll();
                  }} style={{ flex: 1, accentColor: "#7c3aed" }} />
                <Typography variant="caption" sx={{ width: 36 }}>{imgOpacity}%</Typography>
              </Stack>
            </Stack>
          )}

          {!selType && (
            <Typography variant="body2" color="text.secondary">Select an object on the canvas to edit its properties.</Typography>
          )}
        </Box>

        {/* Center: Canvas */}
        <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#f1f5f9" }}>
          {/* Toolbar */}
          <Box sx={{ display: "flex", gap: 0.5, p: 1, background: "#fff", borderBottom: "1px solid", borderColor: "divider", flexWrap: "wrap" }}>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Set Background Image"><Button size="small" variant="outlined" onClick={() => bgFileRef.current?.click()}>BG</Button></Tooltip>
              <Button size="small" variant="outlined" onClick={() => fileInputRef.current?.click()}>+ Image</Button>
              <Button size="small" variant="outlined" onClick={addText}>+ Text</Button>
            </Stack>
            <Box sx={{ mx: 0.5, width: 1, background: "divider" }} />
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Delete (Del)"><Button size="small" variant="outlined" color="error" onClick={deleteSelected}>Del</Button></Tooltip>
              <Tooltip title="Undo (Ctrl+Z)"><Button size="small" variant="outlined" onClick={undo}>↩</Button></Tooltip>
              <Tooltip title="Redo (Ctrl+Y)"><Button size="small" variant="outlined" onClick={redo}>↪</Button></Tooltip>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Bring Forward"><Button size="small" variant="outlined" onClick={bringForward}>↑</Button></Tooltip>
              <Tooltip title="Send Backward"><Button size="small" variant="outlined" onClick={sendBackward}>↓</Button></Tooltip>
            </Stack>
            {hasOcrImage && (
              <Tooltip title="Extract text from image using OCR — creates editable text layers">
                <span>
                  <Button size="small" variant="outlined" onClick={extractTextFromImage} disabled={ocrProcessing}
                    startIcon={ocrProcessing ? <CircularProgress size={12} color="inherit" /> : null}
                    sx={{ borderColor: "#7c3aed", color: "#7c3aed", "&:hover": { borderColor: "#6d28d9", background: "#f5f3ff" } }}>
                    {ocrProcessing ? "Reading…" : "Extract Text"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Box>

          {/* Canvas */}
          <Box sx={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", p: 3 }}>
            <Box sx={{ position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,.14)", borderRadius: 2 }}>
              <canvas id="dt-canvas" />
              {loading && (
                <Box sx={{
                  position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 2, background: "rgba(255,255,255,0.85)",
                  borderRadius: 2, zIndex: 10,
                }}>
                  <CircularProgress size={28} />
                  <Typography>Loading template…</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Right: Customizable fields summary */}
        <Box sx={{ borderLeft: "1px solid", borderColor: "divider", overflowY: "auto", p: 2, background: "#fafafa" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Customizable Fields</Typography>
            <Chip label={customFields.length} size="small" color={customFields.length > 0 ? "warning" : "default"} />
          </Stack>

          {customFields.length === 0 ? (
            <Alert severity="info" sx={{ fontSize: "0.78rem", mt: 1 }}>
              Select a text object and toggle "Customer Can Edit This" to create customizable fields.
            </Alert>
          ) : (
            <Stack spacing={1}>
              {customFields.map((f, i) => (
                <Paper key={f.id} variant="outlined" sx={{ p: 1.5, borderColor: "#f59e0b", borderWidth: 2, borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{f.label}</Typography>
                      <Typography variant="caption" color="text.secondary">Default: "{f.defaultValue || "—"}"</Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">Max: {f.maxLength} chars{f.required ? " · required" : ""}</Typography>
                    </Box>
                    <Button size="small" color="error" onClick={() => removeField(f.id)} sx={{ minWidth: 0, px: 0.5 }}>✕</Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.6 }}>
            Customizable fields appear as text inputs on your Shopify product page. The customer's text replaces the original in the design, keeping the same font, size, and color.
          </Typography>
        </Box>

      </Box>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
      <input ref={bgFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleBgFile} />

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={snack.sev} onClose={() => setSnack(s => ({ ...s, open: false }))}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
