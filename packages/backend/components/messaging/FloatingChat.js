"use client";
import {
    Box, Fab, Badge, Avatar, Typography, Stack, TextField, IconButton,
    CircularProgress, Tooltip, Paper, InputAdornment, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, Chip, List, ListItem, ListItemAvatar,
    ListItemText, Checkbox,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import GroupIcon from "@mui/icons-material/Group";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import PersonIcon from "@mui/icons-material/Person";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";

const POLL_CONVS_MS  = 10_000;
const POLL_MSGS_MS   = 5_000;
const POLL_USERS_MS  = 60_000;
const ONLINE_WINDOW  = 5 * 60 * 1000;

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

function groupAvatarProps(group) {
    const initials = group.name
        ? group.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "G";
    const color = group.avatar?.startsWith("#") ? group.avatar : "#6366f1";
    return { children: initials, sx: { bgcolor: color, fontSize: "0.75rem", fontWeight: 700 } };
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

function formatBytes(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(fileType) {
    return fileType?.startsWith("image/");
}

function OnlineDot({ online }) {
    return (
        <Box sx={{
            position: "absolute", bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: "50%",
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

function FileAttachment({ msg, isMe }) {
    if (!msg.fileUrl) return null;
    if (isImage(msg.fileType)) {
        return (
            <Box
                component="a"
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "block", mt: msg.text ? 0.5 : 0 }}
            >
                <Box
                    component="img"
                    src={msg.fileUrl}
                    alt={msg.fileName}
                    sx={{
                        maxWidth: 220,
                        maxHeight: 180,
                        borderRadius: 1.5,
                        display: "block",
                        objectFit: "cover",
                        border: "1px solid rgba(0,0,0,0.08)",
                    }}
                />
            </Box>
        );
    }
    return (
        <Box
            component="a"
            href={msg.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mt: msg.text ? 0.5 : 0,
                px: 1.25,
                py: 0.75,
                borderRadius: 1.5,
                bgcolor: isMe ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)",
                textDecoration: "none",
                color: "inherit",
                "&:hover": { bgcolor: isMe ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.1)" },
            }}
        >
            <InsertDriveFileIcon sx={{ fontSize: 18, opacity: 0.8, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                    {msg.fileName}
                </Typography>
                {msg.fileSize && (
                    <Typography sx={{ fontSize: "0.65rem", opacity: 0.7 }}>
                        {formatBytes(msg.fileSize)}
                    </Typography>
                )}
            </Box>
        </Box>
    );
}

export function FloatingChat({ requiredRoles }) {
    const { data: session } = useSession();
    const me   = session?.user?.userName;
    const role = session?.user?.role;

    const [open, setOpen]                   = useState(false);
    const [conversations, setConversations] = useState([]);
    const [totalUnread, setTotalUnread]     = useState(0);
    const [activeConv, setActiveConv]       = useState(null); // { type: "dm"|"group", id, name? }
    const [messages, setMessages]           = useState([]);
    const [users, setUsers]                 = useState([]);
    const [newMsg, setNewMsg]               = useState("");
    const [sending, setSending]             = useState(false);
    const [search, setSearch]               = useState("");
    const [msgSearch, setMsgSearch]         = useState("");
    const [showPicker, setShowPicker]       = useState(false);
    const [pickerTab, setPickerTab]         = useState("dm"); // "dm" | "group"
    const [loadingMsgs, setLoadingMsgs]     = useState(false);
    const [uploading, setUploading]         = useState(false);
    const [pendingFile, setPendingFile]     = useState(null); // { name, type, size, uploading }

    // Group create dialog
    const [groupDialog, setGroupDialog]     = useState(false);
    const [groupName, setGroupName]         = useState("");
    const [groupMembers, setGroupMembers]   = useState([]);
    const [creatingGroup, setCreatingGroup] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);
    const fileInputRef   = useRef(null);
    const activeConvRef  = useRef(null);
    activeConvRef.current = activeConv;

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
                if (!activeConvRef.current) setTotalUnread(res.data.totalUnread);
            }
        } catch {}
    }, [me]);

    const fetchMessages = useCallback(async (conv) => {
        if (!me || !conv) return;
        try {
            const url = conv.type === "group"
                ? `/api/messages?group=${conv.id}`
                : `/api/messages?with=${conv.id}`;
            const res = await axios.get(url);
            if (!res.data.error) {
                setMessages(res.data.messages);
                setConversations(prev => prev.map(c =>
                    c._id === conv.id ? { ...c, unread: 0 } : c
                ));
            }
        } catch {}
    }, [me]);

    useEffect(() => { if (me) fetchUsers(); }, [me, fetchUsers]);

    useEffect(() => {
        if (!me) return;
        fetchConversations();
        const id = setInterval(fetchConversations, POLL_CONVS_MS);
        return () => clearInterval(id);
    }, [me, fetchConversations]);

    useEffect(() => {
        if (!me || !open) return;
        const id = setInterval(fetchUsers, POLL_USERS_MS);
        return () => clearInterval(id);
    }, [me, open, fetchUsers]);

    useEffect(() => {
        if (!me || !activeConv || !open) return;
        const id = setInterval(() => fetchMessages(activeConv), POLL_MSGS_MS);
        return () => clearInterval(id);
    }, [me, activeConv, open, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openConversation = async (conv) => {
        setActiveConv(conv);
        setShowPicker(false);
        setSearch("");
        setMsgSearch("");
        setLoadingMsgs(true);
        await fetchMessages(conv);
        setLoadingMsgs(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const send = async (filePayload) => {
        const text = newMsg.trim();
        if (!text && !filePayload) return;
        if (!activeConv) return;
        setNewMsg("");
        setSending(true);
        try {
            const body = activeConv.type === "group"
                ? { group: activeConv.id, text, ...filePayload }
                : { to: activeConv.id, text, ...filePayload };
            await axios.post("/api/messages", body);
            await fetchMessages(activeConv);
        } catch {}
        setSending(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        setPendingFile({ name: file.name, type: file.type, size: file.size });
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await axios.post("/api/messages/upload", form);
            if (!res.data.error) {
                await send({
                    fileUrl:  res.data.url,
                    fileName: res.data.fileName,
                    fileType: res.data.fileType,
                    fileSize: res.data.fileSize,
                });
            }
        } catch {}
        setUploading(false);
        setPendingFile(null);
    };

    const openNew = () => {
        setShowPicker(true);
        setActiveConv(null);
        setSearch("");
        setPickerTab("dm");
    };

    const goBack = () => {
        setActiveConv(null);
        setShowPicker(false);
        setMessages([]);
        setSearch("");
        setMsgSearch("");
    };

    const createGroup = async () => {
        if (!groupName.trim() || groupMembers.length === 0) return;
        setCreatingGroup(true);
        try {
            const res = await axios.post("/api/messages/groups", {
                name: groupName.trim(),
                members: groupMembers,
            });
            if (!res.data.error) {
                setGroupDialog(false);
                setGroupName("");
                setGroupMembers([]);
                setShowPicker(false);
                await fetchConversations();
                openConversation({ type: "group", id: res.data.group._id, name: res.data.group.name });
            }
        } catch {}
        setCreatingGroup(false);
    };

    const toggleGroupMember = (userName) => {
        setGroupMembers(prev =>
            prev.includes(userName) ? prev.filter(u => u !== userName) : [...prev, userName]
        );
    };

    if (!me) return null;
    if (requiredRoles && !requiredRoles.includes(role)) return null;

    const filterStr = search.toLowerCase();

    const filteredConvs = conversations.filter(c => {
        if (!filterStr) return true;
        if (c.type === "group") {
            return c.name?.toLowerCase().includes(filterStr);
        }
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

    const visibleMessages = msgSearch.trim()
        ? messages.filter(m =>
            m.text?.toLowerCase().includes(msgSearch.toLowerCase()) ||
            m.fileName?.toLowerCase().includes(msgSearch.toLowerCase())
          )
        : messages;

    const activeUserObj = activeConv?.type === "dm"
        ? users.find(u => u.userName === activeConv.id)
        : null;

    const activeGroupConv = activeConv?.type === "group"
        ? conversations.find(c => c._id === activeConv.id && c.type === "group")
        : null;

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
                        height: { xs: "calc(100vh - 120px)", sm: 540 },
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
                                {(activeConv || showPicker) && (
                                    <IconButton size="small" onClick={goBack}>
                                        <ArrowBackIcon fontSize="small" />
                                    </IconButton>
                                )}
                                {activeConv?.type === "dm" && activeUserObj ? (
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
                                ) : activeConv?.type === "group" ? (
                                    <Stack direction="row" alignItems="center" spacing={1.25}>
                                        <Avatar {...groupAvatarProps(activeGroupConv ?? { name: activeConv.name })} sx={{ width: 30, height: 30, fontSize: "0.7rem", fontWeight: 700, ...groupAvatarProps(activeGroupConv ?? { name: activeConv.name }).sx }} />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>
                                                {activeConv.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.65rem" }}>
                                                {activeGroupConv?.members?.length ?? ""} members
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
                                {!activeConv && !showPicker && (
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
                    {activeConv && (
                        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            {/* In-thread search */}
                            <Box sx={{ px: 1.5, pt: 0.75, pb: 0.25, borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="Search messages…"
                                    value={msgSearch}
                                    onChange={e => setMsgSearch(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: msgSearch ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setMsgSearch("")} sx={{ p: 0.25 }}>
                                                    <CloseIcon sx={{ fontSize: 13 }} />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                        sx: { borderRadius: 2, bgcolor: "#f8fafc", fontSize: "0.8rem", "& input": { py: 0.5 } },
                                    }}
                                />
                            </Box>

                            <Box sx={{ flex: 1, overflowY: "auto", px: 2, py: 1.5, display: "flex", flexDirection: "column", gap: 0.75 }}>
                                {loadingMsgs ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : visibleMessages.length === 0 ? (
                                    <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", pt: 4 }}>
                                        {msgSearch ? "No messages match your search" : "No messages yet — say hello!"}
                                    </Typography>
                                ) : visibleMessages.map((msg, i) => {
                                    const isMe = msg.from === me;
                                    const senderObj = !isMe
                                        ? (users.find(u => u.userName === msg.from) ?? { userName: msg.from })
                                        : null;
                                    const showSender = activeConv.type === "group" && !isMe;
                                    return (
                                        <Box key={msg._id ?? i} sx={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 0.75 }}>
                                            {!isMe && (activeUserObj || showSender) && (
                                                <Avatar
                                                    {...(senderObj ? buildAvatarProps(senderObj) : {})}
                                                    sx={{ width: 24, height: 24, fontSize: "0.6rem", ...(senderObj ? buildAvatarProps(senderObj).sx : {}), flexShrink: 0, mb: 0.25 }}
                                                />
                                            )}
                                            <Box sx={{ maxWidth: 280 }}>
                                                {showSender && (
                                                    <Typography sx={{ fontSize: "0.65rem", color: "text.disabled", mb: 0.25, pl: 0.5 }}>
                                                        {displayName(senderObj)}
                                                    </Typography>
                                                )}
                                                <Box
                                                    sx={{
                                                        px: 1.5, py: 0.875,
                                                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                        bgcolor: isMe ? "#6366f1" : "#f3f4f6",
                                                        color: isMe ? "#fff" : "text.primary",
                                                    }}
                                                >
                                                    {msg.text && (
                                                        <Typography sx={{ fontSize: "0.875rem", lineHeight: 1.4, wordBreak: "break-word" }}>
                                                            {msg.text}
                                                        </Typography>
                                                    )}
                                                    <FileAttachment msg={msg} isMe={isMe} />
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

                            {/* Pending file indicator */}
                            {pendingFile && (
                                <Box sx={{ px: 2, py: 0.5, bgcolor: "#f0f0ff", borderTop: "1px solid rgba(99,102,241,0.15)" }}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CircularProgress size={12} sx={{ color: "#6366f1" }} />
                                        <Typography sx={{ fontSize: "0.75rem", color: "#6366f1" }}>
                                            Uploading {pendingFile.name}…
                                        </Typography>
                                    </Stack>
                                </Box>
                            )}

                            <Box sx={{ px: 1.5, py: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "#fafafa" }}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                />
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
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Tooltip title="Attach file">
                                                    <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={uploading} sx={{ p: 0.5 }}>
                                                        <AttachFileIcon sx={{ fontSize: 18, color: uploading ? "text.disabled" : "text.secondary" }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </InputAdornment>
                                        ),
                                        endAdornment: newMsg.trim() ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => send()} disabled={sending} color="primary">
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
                    {!activeConv && (
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

                            {showPicker && (
                                <Stack direction="row" spacing={1} sx={{ px: 1.5, pb: 0.5 }}>
                                    <Chip
                                        icon={<PersonIcon sx={{ fontSize: 14 }} />}
                                        label="Direct"
                                        size="small"
                                        onClick={() => setPickerTab("dm")}
                                        variant={pickerTab === "dm" ? "filled" : "outlined"}
                                        sx={{ cursor: "pointer", ...(pickerTab === "dm" ? { bgcolor: "#6366f1", color: "#fff", "& .MuiChip-icon": { color: "#fff" } } : {}) }}
                                    />
                                    <Chip
                                        icon={<GroupAddIcon sx={{ fontSize: 14 }} />}
                                        label="New Group"
                                        size="small"
                                        onClick={() => { setGroupDialog(true); setGroupMembers([]); setGroupName(""); }}
                                        variant="outlined"
                                        sx={{ cursor: "pointer" }}
                                    />
                                </Stack>
                            )}

                            <Box sx={{ flex: 1, overflowY: "auto" }}>
                                {showPicker ? (
                                    filteredUsers.length === 0 ? (
                                        <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", pt: 4 }}>
                                            No users found
                                        </Typography>
                                    ) : filteredUsers.map(u => (
                                        <ConvRow
                                            key={u.userName}
                                            avatar={<UserAvatar user={u} size={38} />}
                                            name={displayName(u)}
                                            subtitle={u.role ?? ""}
                                            unread={0}
                                            onClick={() => openConversation({ type: "dm", id: u.userName })}
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
                                    if (c.type === "group") {
                                        const gAp = groupAvatarProps(c);
                                        return (
                                            <ConvRow
                                                key={c._id}
                                                avatar={
                                                    <Avatar {...gAp} sx={{ width: 38, height: 38, ...gAp.sx }}>
                                                        {gAp.children}
                                                    </Avatar>
                                                }
                                                name={c.name}
                                                subtitle={c.lastMessage}
                                                meta={formatTime(c.lastDate)}
                                                unread={c.unread}
                                                onClick={() => openConversation({ type: "group", id: c._id, name: c.name })}
                                                noOnlineDot
                                            />
                                        );
                                    }
                                    const u = users.find(u => u.userName === c._id) ?? { userName: c._id };
                                    return (
                                        <ConvRow
                                            key={c._id}
                                            avatar={<UserAvatar user={u} size={38} />}
                                            name={displayName(u)}
                                            subtitle={c.lastMessage}
                                            meta={formatTime(c.lastDate)}
                                            unread={c.unread}
                                            onClick={() => openConversation({ type: "dm", id: c._id })}
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

            {/* Create Group Dialog */}
            <Dialog open={groupDialog} onClose={() => setGroupDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>New Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        label="Group name"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        sx={{ mb: 2, mt: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: "block" }}>
                        Members
                    </Typography>
                    <List dense sx={{ maxHeight: 240, overflowY: "auto", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 1 }}>
                        {users.map(u => (
                            <ListItem
                                key={u.userName}
                                button
                                onClick={() => toggleGroupMember(u.userName)}
                                sx={{ py: 0.5 }}
                            >
                                <ListItemAvatar sx={{ minWidth: 40 }}>
                                    <Avatar {...buildAvatarProps(u)} sx={{ width: 28, height: 28, fontSize: "0.7rem", ...buildAvatarProps(u).sx }} />
                                </ListItemAvatar>
                                <ListItemText
                                    primary={displayName(u)}
                                    primaryTypographyProps={{ variant: "body2" }}
                                />
                                <Checkbox
                                    edge="end"
                                    checked={groupMembers.includes(u.userName)}
                                    size="small"
                                    sx={{ "&.Mui-checked": { color: "#6366f1" } }}
                                />
                            </ListItem>
                        ))}
                    </List>
                    {groupMembers.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 1 }}>
                            {groupMembers.map(un => {
                                const u = users.find(u => u.userName === un);
                                return <Chip key={un} label={u ? displayName(u) : un} size="small" onDelete={() => toggleGroupMember(un)} />;
                            })}
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setGroupDialog(false)} size="small">Cancel</Button>
                    <Button
                        onClick={createGroup}
                        variant="contained"
                        size="small"
                        disabled={!groupName.trim() || groupMembers.length === 0 || creatingGroup}
                        sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
                    >
                        {creatingGroup ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function ConvRow({ avatar, name, subtitle, meta, unread, onClick }) {
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
            <Box sx={{ flexShrink: 0 }}>{avatar}</Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: unread > 0 ? 700 : 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {name}
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
