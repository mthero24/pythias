"use client";
import {
  Typography,
  Container,
  Button,
  TextField,
  Grid2,
  Divider,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import TuneIcon from '@mui/icons-material/Tune';
import LayersIcon from '@mui/icons-material/Layers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useState } from "react";
import axios from "axios";
import { Standard } from "./ShippingBags";

export function Main({ bla, basePath = "/admin/blanks" }) {
  const [blank, setBlank] = useState(bla)
  const [dimensions, setDimensions] = useState(blank.singleShippingDimensions || null);

  const save = async (blank) => {
    await axios.post("/api/admin/blanks", { blank });
  }

  const handleUpdateEnvelope = async ({ pl, size, key }) => {
    let b = { ...blank }
    if (!size) {
      let envelopes = b.envelopes.filter(e => e.placement == pl.name)
      for (let e of envelopes) e[key] = event.target.value
    } else {
      let envelopes = b.envelopes.filter(e => e.placement == pl.name && e.sizeName == size)
      for (let e of envelopes) e[key] = event.target.value
    }
    setBlank({ ...b })
    save({ ...b })
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{blank.name}</Typography>
          <Typography variant="body2" color="text.secondary">{blank.code}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} href={basePath}>Back to Blanks</Button>
      </Box>

      <Stack spacing={3}>
        <SectionCard icon={<TuneIcon />} title="Envelope Settings" subtitle="Configure print envelope dimensions per location and size">
          <EnvelopeSettings blank={blank} handleUpdateEnvelope={handleUpdateEnvelope} />
        </SectionCard>

        <SectionCard icon={<LayersIcon />} title="Fold Settings" subtitle="Configure fold dimensions per size">
          <FoldSettings blank={blank} setBlank={setBlank} save={save} />
        </SectionCard>

        <SectionCard icon={<LocalShippingIcon />} title="Shipping Bag" subtitle="Select the packaging type and size used when shipping this blank">
          {dimensions && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`Current: ${dimensions.packageType} · ${dimensions.name === "set_your_own" ? "Custom" : dimensions.name.replace(/_/g, " ")} · ${dimensions.width}×${dimensions.length}×${dimensions.height} in`}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
          )}
          <Standard blank={blank} setBlank={setBlank} save={save} dimensions={dimensions} setDimensions={setDimensions} />
        </SectionCard>
      </Stack>
    </Container>
  );
}

const SectionCard = ({ icon, title, subtitle, children }) => (
  <Card variant="outlined" sx={{ borderRadius: 2 }}>
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ color: "primary.main", mt: 0.25 }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </CardContent>
  </Card>
)

const FoldSettings = ({ blank, setBlank, save }) => {
  if (!blank.fold?.length) return <Typography variant="body2" color="text.secondary">No fold settings configured.</Typography>
  return (
    <Stack spacing={1}>
      {blank.fold.map((f) => (
        <Accordion key={f._id} variant="outlined" disableGutters sx={{ borderRadius: "8px !important", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{f.sizeName}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Grid2 container spacing={1.5}>
              {Object.keys(f).filter(k => k !== "size" && k !== "sizeName" && k !== "_id").map((key) => (
                <Grid2 size={{ xs: 6, sm: 4 }} key={key}>
                  <TextField
                    fullWidth
                    size="small"
                    label={key}
                    value={f[key]}
                    onChange={() => {
                      let b = { ...blank }
                      let fold = b.fold.find(fl => fl._id.toString() === f._id.toString())
                      fold[key] = event.target.value
                      setBlank({ ...b })
                      save({ ...b })
                    }}
                  />
                </Grid2>
              ))}
            </Grid2>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  )
};

const EnvelopeSettings = ({ blank, handleUpdateEnvelope }) => {
  const keys = ["platen", "width", "height", "vertoffset", "horizoffset"]
  if (!blank.printLocations?.length) return <Typography variant="body2" color="text.secondary">No print locations configured.</Typography>
  const envelopes = blank.envelopes ?? [];
  return (
    <Stack spacing={1}>
      {blank.printLocations.map(pl => (
        <Accordion key={pl._id} variant="outlined" disableGutters sx={{ borderRadius: "8px !important", "&:before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{pl.name}</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", mb: 1 }}>Default (all sizes)</Typography>
            <Grid2 container spacing={1.5} sx={{ mb: 2 }}>
              {keys.map((key) => (
                <Grid2 size={{ xs: 6, sm: 2.4 }} key={key}>
                  <TextField
                    fullWidth
                    size="small"
                    label={key}
                    type="number"
                    value={envelopes.filter(e => e.placement == pl.name)[0]?.[key] ?? ""}
                    onChange={() => handleUpdateEnvelope({ pl, key })}
                  />
                </Grid2>
              ))}
            </Grid2>

            {(blank.sizes?.length > 0) && (
              <>
                <Typography variant="caption" sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block", mb: 1 }}>Per Size Overrides</Typography>
                <Stack spacing={1.5}>
                  {blank.sizes.map((s) => {
                    const envelope = envelopes.find(e => e.placement == pl.name && e.sizeName == s.name)
                    if (!envelope) return null
                    return (
                      <Box key={s._id}>
                        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.75 }}>{s.name}</Typography>
                        <Grid2 container spacing={1.5}>
                          {keys.map((key) => (
                            <Grid2 size={{ xs: 6, sm: 2.4 }} key={key}>
                              <TextField
                                fullWidth
                                size="small"
                                label={key}
                                type={key === "placement" ? "text" : "number"}
                                value={envelope[key] ?? ""}
                                onChange={() => handleUpdateEnvelope({ pl, size: s.name, key })}
                              />
                            </Grid2>
                          ))}
                        </Grid2>
                      </Box>
                    )
                  })}
                </Stack>
              </>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
};
