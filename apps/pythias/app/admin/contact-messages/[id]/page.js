"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Box, Container, Typography, Stack, Chip, Paper, Button, Divider,
    TextField, CircularProgress, Alert, IconButton, Tooltip,
} from "@mui/material";
import ArrowBackIcon          from "@mui/icons-material/ArrowBack";
import MarkEmailReadIcon      from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon    from "@mui/icons-material/MarkEmailUnread";
import PauseCircleIcon        from "@mui/icons-material/PauseCircle";
import PlayCircleIcon         from "@mui/icons-material/PlayCircle";
import SaveIcon               from "@mui/icons-material/Save";
import EmailIcon              from "@mui/icons-material/Email";
import BusinessIcon           from "@mui/icons-material/Business";
import PhoneIcon              from "@mui/icons-material/Phone";
import CheckCircleIcon        from "@mui/icons-material/CheckCircle";
import ScheduleIcon           from "@mui/icons-material/Schedule";
import axios from "axios";

const STEP_NAMES = [
    "Thanks for reaching out",
    "How Pythias works",
    "What does it cost?",
    "Final follow-up",
];

function fmtDate(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SequencePanel({ sequence, messageId, onUpdate }) {
    if (!sequence) return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary">No follow-up sequence enrolled.</Typography>
        </Paper>
    );

    const sentSteps  = STEP_NAMES.slice(0, sequence.step);
    const nextStep   = sequence.completed ? null : STEP_NAMES[sequence.step];
    const remaining  = sequence.completed ? [] : STEP_NAMES.slice(sequence.step + 1);

    const togglePause = async () => {
        const action = sequence.paused ? "resume" : "pause";
        await axios.patch("/api/admin/contact-messages", { id: messageId, action });
        onUpdate({ ...sequence, paused: !sequence.paused });
    };

    return (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography fontWeight={700} fontSize="0.9rem">Follow-up Sequence</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    {sequence.completed && <Chip label="Completed" size="small" color="success" />}
                    {sequence.unsubscribed && <Chip label="Unsubscribed" size="small" color="error" />}
                    {sequence.paused && !sequence.unsubscribed && <Chip label="Paused" size="small" color="warning" />}
                    {!sequence.completed && !sequence.unsubscribed && (
                        <Tooltip title={sequence.paused ? "Resume follow-ups" : "Pause follow-ups"}>
                            <IconButton size="small" onClick={togglePause} color={sequence.paused ? "success" : "warning"}>
                                {sequence.paused ? <PlayCircleIcon fontSize="small" /> : <PauseCircleIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    )}
                </Stack>
            </Stack>

            <Stack spacing={1.5}>
                {sentSteps.map((name, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                        <CheckCircleIcon sx={{ fontSize: 18, color: "success.main", mt: 0.15, flexShrink: 0 }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600}>{name}</Typography>
                            {i === sentSteps.length - 1 && sequence.lastSentAt && (
                                <Typography variant="caption" color="text.secondary">Sent {fmtDate(sequence.lastSentAt)}</Typography>
                            )}
                        </Box>
                    </Stack>
                ))}

                {nextStep && (
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                        <ScheduleIcon sx={{ fontSize: 18, color: sequence.paused ? "warning.main" : "info.main", mt: 0.15, flexShrink: 0 }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600}>{nextStep}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {sequence.paused ? "Paused" : `Scheduled ${fmtDate(sequence.nextSendAt)}`}
                            </Typography>
                        </Box>
                    </Stack>
                )}

                {remaining.map((name, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start" sx={{ opacity: 0.45 }}>
                        <Box sx={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid", borderColor: "divider", flexShrink: 0, mt: 0.15 }} />
                        <Typography variant="body2">{name}</Typography>
                    </Stack>
                ))}
            </Stack>
        </Paper>
    );
}

export default function ContactMessageDetailPage() {
    const { id }   = useParams();
    const router   = useRouter();
    const [msg,      setMsg]      = useState(null);
    const [seq,      setSeq]      = useState(null);
    const [notes,    setNotes]    = useState("");
    const [saving,   setSaving]   = useState(false);
    const [saved,    setSaved]    = useState(false);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`/api/admin/contact-messages/${id}`);
                setMsg(res.data.message);
                setSeq(res.data.sequence);
                setNotes(res.data.message.notes || "");
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const saveNotes = async () => {
        setSaving(true);
        await axios.patch("/api/admin/contact-messages", { id, notes });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleRead = async () => {
        const next = !msg.read;
        await axios.patch("/api/admin/contact-messages", { id, read: next });
        setMsg(m => ({ ...m, read: next }));
    };

    if (loading) return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;
    if (error)   return <Container sx={{ mt: 6 }}><Alert severity="error">{error}</Alert></Container>;

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={4}>
                <IconButton onClick={() => router.push("/admin/contact-messages")} size="small">
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h5" fontWeight={800}>Contact Message</Typography>
                <Box flex={1} />
                <Tooltip title={msg.read ? "Mark unread" : "Mark read"}>
                    <IconButton onClick={toggleRead} size="small">
                        {msg.read ? <MarkEmailUnreadIcon /> : <MarkEmailReadIcon sx={{ color: "#7c3aed" }} />}
                    </IconButton>
                </Tooltip>
                {!msg.read && <Chip label="New" size="small" sx={{ bgcolor: "#7c3aed", color: "#fff", fontWeight: 700 }} />}
            </Stack>

            <Stack spacing={3}>
                {/* Contact info */}
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                            <Typography fontWeight={800} fontSize="1.1rem">{msg.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {new Date(msg.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                {msg.source && ` · ${msg.source.replace(/_/g, " ")}`}
                            </Typography>
                        </Box>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={2} mb={2.5}>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                            <EmailIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                            <Typography variant="body2">
                                <a href={`mailto:${msg.email}`} style={{ color: "#7c3aed", textDecoration: "none" }}>{msg.email}</a>
                            </Typography>
                        </Stack>
                        {msg.company && (
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <BusinessIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                <Typography variant="body2">{msg.company}</Typography>
                            </Stack>
                        )}
                        {msg.phone && (
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                                <PhoneIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                                <Typography variant="body2">{msg.phone}</Typography>
                            </Stack>
                        )}
                    </Stack>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, color: "text.primary" }}>
                        {msg.message}
                    </Typography>
                    {msg.meta && Object.keys(msg.meta).length > 0 && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                            {msg.meta.orderVolume && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Monthly orders: <strong>{msg.meta.orderVolume}</strong>
                                </Typography>
                            )}
                        </Box>
                    )}
                </Paper>

                {/* Follow-up sequence */}
                <SequencePanel sequence={seq} messageId={id} onUpdate={setSeq} />

                {/* Notes */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                    <Typography fontWeight={700} fontSize="0.9rem" mb={1.5}>Internal Notes</Typography>
                    <TextField
                        fullWidth multiline minRows={4}
                        placeholder="Add notes about this contact, meeting outcome, next steps…"
                        value={notes}
                        onChange={e => { setNotes(e.target.value); setSaved(false); }}
                        variant="outlined"
                        sx={{ mb: 1.5 }}
                    />
                    <Stack direction="row" justifyContent="flex-end">
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                            onClick={saveNotes}
                            disabled={saving}
                            color={saved ? "success" : "primary"}
                        >
                            {saved ? "Saved!" : saving ? "Saving…" : "Save Notes"}
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
}
