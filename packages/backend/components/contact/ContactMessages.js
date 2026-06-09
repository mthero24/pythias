"use client";
import { useState } from "react";
import {
  Box, Container, Typography, Stack, Chip, Paper, IconButton,
  Tooltip, Divider, Badge, TextField, InputAdornment, Button,
} from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import SearchIcon from "@mui/icons-material/Search";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

function MessageCard({ msg, onToggleRead, onDelete, detailBase }) {
  const date = new Date(msg.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const seqStatus = msg.sequence
    ? msg.sequence.paused      ? "paused"
    : msg.sequence.completed   ? "done"
    : msg.sequence.unsubscribed? "unsub"
    :                            "active"
    : null;

  return (
    <Paper elevation={0} sx={{
      border: "1px solid",
      borderColor: msg.read ? "#e2e8f0" : "#c4b5fd",
      borderRadius: 2,
      p: 3,
      background: msg.read ? "#fff" : "#faf5ff",
      transition: "border-color .15s",
    }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Stack spacing={0.25} sx={{ minWidth: 0, overflow: "hidden", flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography fontWeight={700} fontSize="0.95rem" sx={{ wordBreak: "break-word" }}>{msg.name}</Typography>
            {!msg.read && (
              <Chip label="New" size="small" sx={{ fontSize: "0.65rem", height: 18, bgcolor: "#7c3aed", color: "#fff" }} />
            )}
            {seqStatus === "active"  && <Chip label="Sequence active" size="small" color="info"    sx={{ height: 18, fontSize: "0.65rem" }} />}
            {seqStatus === "paused"  && <Chip label="Paused" size="small" color="warning" sx={{ height: 18, fontSize: "0.65rem" }} />}
            {seqStatus === "done"    && <Chip label="Sequence done" size="small" color="success" sx={{ height: 18, fontSize: "0.65rem" }} />}
            {seqStatus === "unsub"   && <Chip label="Unsubscribed" size="small" color="error" sx={{ height: 18, fontSize: "0.65rem" }} />}
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {msg.company && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <BusinessIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{msg.company}</Typography>
              </Stack>
            )}
            {msg.phone && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PhoneIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>{msg.phone}</Typography>
              </Stack>
            )}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <EmailIcon sx={{ fontSize: 13, color: "text.disabled" }} />
              <Typography
                variant="caption" color="text.secondary"
                component="a" href={`mailto:${msg.email}`}
                sx={{ textDecoration: "none", wordBreak: "break-all", "&:hover": { textDecoration: "underline" } }}
              >
                {msg.email}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} flexShrink={0} ml={1}>
          <Typography variant="caption" color="text.disabled">{date}</Typography>
          <Tooltip title={msg.read ? "Mark as unread" : "Mark as read"}>
            <IconButton size="small" onClick={() => onToggleRead(msg._id, !msg.read)}>
              {msg.read
                ? <MarkEmailUnreadIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                : <MarkEmailReadIcon  sx={{ fontSize: 18, color: "#7c3aed" }} />
              }
            </IconButton>
          </Tooltip>
          {detailBase && (
            <Tooltip title="Open detail view">
              <IconButton size="small" component="a" href={`${detailBase}/${msg._id}`}>
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete message">
            <IconButton size="small" onClick={() => onDelete(msg._id)} sx={{ color: "#ef4444", "&:hover": { bgcolor: "#fef2f2" } }}>
              <DeleteIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Divider sx={{ mb: 1.5 }} />
      <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.7, mb: msg.notes ? 1.5 : 0 }}>
        {msg.message}
      </Typography>
      {msg.notes && (
        <Box sx={{ bgcolor: "#fefce8", border: "1px solid #fde047", borderRadius: 1.5, px: 1.5, py: 1, mt: 0.5 }}>
          <Typography variant="caption" fontWeight={700} color="#854d0e" display="block">Notes</Typography>
          <Typography variant="caption" color="#92400e" sx={{ whiteSpace: "pre-wrap" }}>{msg.notes}</Typography>
        </Box>
      )}
    </Paper>
  );
}

export function ContactMessages({ messages: initial = [], apiUrl = "/api/admin/contact-messages", detailBase }) {
  const [messages, setMessages] = useState(initial);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [search, setSearch] = useState("");

  const unreadCount = messages.filter(m => !m.read).length;

  const toggleRead = async (id, read) => {
    try {
      await axios.patch(apiUrl, { id, read });
      setMessages(ms => ms.map(m => m._id === id ? { ...m, read } : m));
    } catch {}
  };

  const deleteMsg = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await axios.delete(`${apiUrl}?id=${id}`);
      setMessages(ms => ms.filter(m => m._id !== id));
    } catch {}
  };

  const visible = messages
    .filter(m => filter === "unread" ? !m.read : true)
    .filter(m => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [m.name, m.company, m.email, m.message].some(f => f?.toLowerCase().includes(q));
    });

  return (
    <Box sx={{ minHeight: "90vh", background: "#f8fafc" }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 42, height: 42, borderRadius: 2,
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(124,58,237,.35)",
            }}>
              <EmailIcon sx={{ color: "#fff", fontSize: 22 }} />
            </Box>
            <Box>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>Contact Messages</Typography>
                {unreadCount > 0 && (
                  <Chip label={`${unreadCount} new`} size="small" sx={{ bgcolor: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: "0.7rem" }} />
                )}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {messages.length} total message{messages.length !== 1 ? "s" : ""}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={1.5} mb={3} alignItems="center">
          {["all", "unread"].map(f => (
            <Chip
              key={f}
              label={f === "all" ? `All (${messages.length})` : `Unread (${unreadCount})`}
              onClick={() => setFilter(f)}
              variant={filter === f ? "filled" : "outlined"}
              sx={filter === f ? { bgcolor: "#7c3aed", color: "#fff", fontWeight: 700 } : {}}
            />
          ))}
          <TextField
            size="small" placeholder="Search…" value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ ml: "auto", width: 220 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </Stack>

        {/* Messages */}
        <Stack spacing={2}>
          {visible.length === 0 && (
            <Box sx={{ textAlign: "center", py: 10, background: "#fff", borderRadius: 3, border: "2px dashed #e2e8f0" }}>
              <EmailIcon sx={{ fontSize: 48, color: "#cbd5e1", mb: 1 }} />
              <Typography color="text.secondary">
                {filter === "unread" ? "No unread messages" : "No messages yet"}
              </Typography>
            </Box>
          )}
          {visible.map(m => (
            <MessageCard key={m._id} msg={m} onToggleRead={toggleRead} onDelete={deleteMsg} detailBase={detailBase} />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
