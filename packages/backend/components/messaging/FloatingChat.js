"use client";
import {
    Box, Fab, Badge, Avatar, Typography, Stack, TextField, IconButton,
    CircularProgress, Tooltip, Paper, InputAdornment,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const POLL_CONVS_MS  = 10_000;
const POLL_MSGS_MS   = 5_000;
const POLL_USERS_MS  = 60_000;
const ONLINE_WINDOW  = 5 * 60 * 1000; // 5 minutes

function isOnline(lastSeen) {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW;
}

function buildAvatarProps(user) {
    const initials = user.firstName && user.lastName
        ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
        : (user.userName?.[0] ?? "?").toUpperCase();
    if (user.avatar?.startsWith("http")) {
        return { src: user.avatar, children: initials, sx: { fontSize: "0.8rem" } };
    }
    return { children: initials, sx: { bgcolor: user.avatar || "#6366f1", fontSize: "0.8rem", fontWeight: 700 } };
}

function displayName(user) {
    if (!user) return "Unknown";
    if (user.firstName || user.lastName) return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
    return user.userName;
}

function formatTime(date) {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function OnlineDot({ online }) {
    return (
        <Box sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: "50%",
            bgcolor: online ? "#22c55e" : "#9ca3af",
            border: "2px solid #fff",
        }} />
    );
}

function UserAvatar({ user, size = 38 }) {
    const ap = buildAvatarProps(user);
    const online = isOnline(user?.lastSeen);
    return (
        <Box sx={{ position: "relative", flexShrink: 0, width: size, height: size }}>
            <Avatar {...ap} sx={{ width: size, height: size, ...ap.sx }} />
            <OnlineDot online={online} />
        </Box>
    );
}

export function FloatingChat() {
    const { data: session } = useSession();
    const me = session?.user?.userName;

    const [open, setOpen]                   = useState(false);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread]     = useState(0);
    const [activeUser, setActiveUser]       = useState(null);
    const [messages, setMessages]           = useState([]);
    const [users, setUsers]                 = useState([]);
    const [newMsg, setNewMsg]               = useState("");
    const [sending, setSending]             = useState(false);
    const [search, setSearch]               = useState("");
    const [showPicker, setShowPicker]       = useState(false);
    const [loadingMsgs, setLoadingMsgs]     = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);
    const activeUserRef  = useRef(null);
    activeUserRef.current = activeUser;

    const fetchUsers = useCallback(async () => {
        if (!me) return;
        try {
            const res = await axios.get("/api/messages/users");
            if (!res.data.error) setUsers(res.data.users.filter(u => u.userName !== me));
        } catch {}
    }, [me]);

    const fetchConversations = useCallback(async () => {
        if (!me) return;
        try {
            const res = await axios.get("/api/messages");
            if (!res.data.error) {
                setConversations(res.data.conversations);
                if (!activeUserRef.current) setTotalUnread(res.data.totalUnread);
            }
        } catch {}
    }, [me]);

    const fetchMessages = useCallback(async (withUser) => {
        if (!me || !withUser) return;
        try {
            const res = await axios.get(`/api/messages?with=${withUser}`);
            if (!res.data.error) {
                setMessages(res.data.messages);
                setConversations(prev => prev.map(c =>
                    c._id === withUser ? { ...c, unread: 0 } : c
                ));
                setTotalUnread(prev => Math.max(0, prev));
            }
        } catch {}
    }, [me]);

    // Load users eagerly on mount (so avatars show in conversation list right away)
    useEffect(() => {
        if (me) fetchUsers();
    }, [me, fetchUsers]);

    // Poll conversations always (for unread badge even when closed)
    useEffect(() => {
        if (!me) return;
        fetchConversations();
        const id = setInterval(fetchConversations, POLL_CONVS_MS);
        return () => clearInterval(id);
    }, [me, fetchConversations]);

    // Poll users for online status when open
    useEffect(() => {
        if (!me || !open) return;
        const id = setInterval(fetchUsers, POLL_USERS_MS);
        return () => clearInterval(id);
    }, [me, open, fetchUsers]);

    // Poll active conversation messages
    useEffect(() => {
        if (!me || !activeUser || !open) return;
        const id = setInterval(() => fetchMessages(activeUser), POLL_MSGS_MS);
        return () => clearInterval(id);
    }, [me, activeUser, open, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openConversation = async (userName) => {
        setActiveUser(userName);
        setShowPicker(false);
        setSearch("");
        setLoadingMsgs(true);
        await fetchMessages(userName);
        setLoadingMsgs(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const send = async () => {
        const text = newMsg.trim();
        if (!text || !activeUser) return;
        setNewMsg("");
        setSending(true);
        try {
            await axios.post("/api/messages", { to: activeUser, text });
            await fetchMessages(activeUser);
        } catch {}
        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const openNew = async () => {
        setShowPicker(true);
        setActiveUser(null);
        setSearch("");
    };

    const goBack = () => {
        setActiveUser(null);
        setShowPicker(false);
        setMessages([]);
        setSearch("");
    };

    if (!me) return null;

    const activeUserObj = users.find(u => u.userName === activeUser);

    const filterStr = search.toLowerCase();
    const filteredConvs = conversations.filter(c => {
        if (!filterStr) return true;
        const u = users.find(u => u.userName === c._id);
        return (
            c._id?.toLowerCase().includes(filterStr) ||
            u?.firstName?.toLowerCase().includes(filterStr) ||
            u?.lastName?.toLowerCase().includes(filterStr)
        );
    });
    const filteredUsers = users.filter(u => {
        if (!filterStr) return true;
        return (
            u.userName.toLowerCase().includes(filterStr) ||
            u.firstName?.toLowerCase().includes(filterStr) ||
            u.lastName?.toLowerCase().includes(filterStr)
        );
    });

    return (
        <>
            {open && (
                <Paper
                    elevation={0}
                    sx={{
                        position: "fixed",
                        bottom: 88,
                        right: 24,
                        width: { xs: "calc(100vw - 32px)", sm: 480 },
                        maxWidth: 480,
                        height: { xs: "calc(100vh - 120px)", sm: 500 },
                        borderRadius: 3,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        zIndex: 1300,
                        boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.10)",
                        border: "1px solid rgba(0,0,0,0.08)",
                        bgcolor: "#fff",
                    }}
                >
                    {/* Header */}
                    <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {(activeUser || showPicker) && (
                                    <IconButton size="small" onClick={goBack}>
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                )}
                                {activeUser && activeUserObj ? (
                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                        <UserAvatar user={activeUserObj} size={30} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                {displayName(activeUserObj)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: isOnline(activeUserObj.lastSeen) ? "#22c55e" : "text.disabled", fontSize: "0.65rem" }}>
                                                {isOnline(activeUserObj.lastSeen) ? "Online" : "Offline"}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                ) : (
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                        {showPicker ? "New Message" : "Messages"}
                                    </Typography>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={0.5}>
                                {!activeUser && !showPicker && (
                                    <Tooltip title="New message">
                                        <IconButton size="small" onClick={openNew}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                                <IconButton size="small" onClick={() => setOpen(false)}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Box>

                    {/* Message thread */}
                    {activeUser && (
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
                                {loadingMsgs ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : messages.length === 0 ? (
                                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", pt: 4 }}>
                                        No messages yet — say hello!
                                    </Typography>
                                ) : messages.map((msg, i) => {
                                    const isMe = msg.from === me;
                                    return (
                                        <Box key={msg._id ?? i} sx={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 0.75 }}>
                                            {!isMe && activeUserObj && (
                                                <Avatar
                                                    {...buildAvatarProps(activeUserObj)}
                                                    sx={{ width: 24, height: 24, fontSize: "0.6rem", ...buildAvatarProps(activeUserObj).sx, flexShrink: 0, mb: 0.25 }}
                                                />
                                            )}
                                            <Box>
                                                <Box
                                                    sx={{
                                                        maxWidth: 280,
                                                        px: 1.5, py: 0.875,
                                                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                        bgcolor: isMe ? "#6366f1" : "#f3f4f6",
                                                        color: isMe ? "#fff" : "text.primary",
                                                    }}
                                                >
                                                    <Typography sx={{ fontSize: "0.875rem", lineHeight: 1.4, wordBreak: "break-word" }}>
                                                        {msg.text}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.25, textAlign: isMe ? "right" : "left", fontSize: "0.63rem", px: 0.5 }}>
                                                    {formatTime(msg.date)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </Box>

                            <Box sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "#fafafa" }}>
                                <TextField
                                    inputRef={inputRef}
                                    fullWidth
                                    size="small"
                                    placeholder="Message…"
                                    value={newMsg}
                                    onChange={e => setNewMsg(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    multiline
                                    maxRows={3}
                                    InputProps={{
                                        endAdornment: newMsg.trim() ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={send} disabled={sending} color="primary">
                                                    {sending ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ) : undefined,
                                        sx: { borderRadius: 3, bgcolor: "#fff" },
                                    }}
                                />
                            </Box>
                        </Box>
                    )}

                    {/* Conversation list / user picker */}
                    {!activeUser && (
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <Box sx={{ px: 1.5, pt: 1, pb: 0.5 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder={showPicker ? "Search people…" : "Search conversations…"}
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                                            </InputAdornment>
                                        ),
                                        sx: { borderRadius: 2, bgcolor: "#f3f4f6" },
                                    }}
                                />
                            </Box>

                            <Box sx={{ flex: 1, overflowY: "auto" }}>
                                {showPicker ? (
                                    filteredUsers.length === 0 ? (
                                        <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", pt: 4 }}>
                                            No users found
                                        </Typography>
                                    ) : filteredUsers.map(u => (
                                        <ConvRow
                                            key={u.userName}
                                            user={u}
                                            subtitle={u.role ?? ""}
                                            unread={0}
                                            onClick={() => openConversation(u.userName)}
                                        />
                                    ))
                                ) : filteredConvs.length === 0 ? (
                                    <Box sx={{ px: 2, pt: 4, textAlign: "center" }}>
                                        <Typography variant="body2" color="text.disabled">No conversations yet</Typography>
                                        <Typography variant="caption" color="text.disabled">
                                            Click the pencil icon to start one
                                        </Typography>
                                    </Box>
                                ) : filteredConvs.map(c => {
                                    const u = users.find(u => u.userName === c._id) ?? { userName: c._id };
                                    return (
                                        <ConvRow
                                            key={c._id}
                                            user={u}
                                            subtitle={c.lastMessage}
                                            meta={formatTime(c.lastDate)}
                                            unread={c.unread}
                                            onClick={() => openConversation(c._id)}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    )}
                </Paper>
            )}

            {/* FAB */}
            <Fab
                onClick={() => setOpen(o => !o)}
                sx={{
                    position: "fixed",
                    bottom: 24,
                    right: 24,
                    zIndex: 1300,
                    bgcolor: "#6366f1",
                    "&:hover": { bgcolor: "#4f46e5" },
                    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                }}
            >
                <Badge badgeContent={totalUnread || null} color="error" max={99}>
                    <ChatIcon sx={{ color: "#fff" }} />
                </Badge>
            </Fab>
        </>
    );
}

function ConvRow({ user, subtitle, meta, unread, onClick }) {
    const ap = buildAvatarProps(user);
    const online = isOnline(user?.lastSeen);
    return (
        <Box
            onClick={onClick}
            sx={{
                px: 2, py: 1.25, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 1.5,
                "&:hover": { bgcolor: "#f8fafc" },
                borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
        >
            {/* Avatar with online dot */}
            <Box sx={{ position: "relative", flexShrink: 0, width: 38, height: 38 }}>
                <Avatar {...ap} sx={{ width: 38, height: 38, ...ap.sx }} />
                <Box sx={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 10, height: 10, borderRadius: "50%",
                    bgcolor: online ? "#22c55e" : "#9ca3af",
                    border: "2px solid #fff",
                }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: unread > 0 ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {displayName(user)}
                    </Typography>
                    {meta && (
                        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0, ml: 1, fontSize: "0.63rem" }}>
                            {meta}
                        </Typography>
                    )}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: unread > 0 ? 600 : 400 }}>
                    {subtitle}
                </Typography>
            </Box>

            {unread > 0 && (
                <Box sx={{ width: 18, height: 18, borderRadius: "50%", bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Typography sx={{ fontSize: "0.62rem", color: "#fff", fontWeight: 700 }}>
                        {unread > 9 ? "9+" : unread}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
