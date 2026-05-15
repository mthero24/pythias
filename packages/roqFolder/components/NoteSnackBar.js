"use client";
import { Box, Typography, Snackbar, IconButton, Stack } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import NotesIcon from "@mui/icons-material/Notes";
import { Fragment } from "react";

export const NoteSnackBar = ({ notes, open, setOpen }) => {
    return (
        <Snackbar
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            open={open}
            onClose={() => setOpen(false)}
            message={
                <Stack spacing={0.75}>
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
                        <NotesIcon sx={{ fontSize: 15, color: "#fff" }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#fff" }}>
                            Order Notes
                        </Typography>
                    </Stack>
                    {notes.map((note, i) => (
                        <Box key={note._id ?? i} sx={{ bgcolor: "rgba(255,255,255,0.12)", borderRadius: 1, px: 1.25, py: 0.75 }}>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", display: "block", fontSize: "0.68rem" }}>
                                {new Date(note.date).toLocaleDateString("en-US")} · {note.userName}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#fff", fontSize: "0.82rem" }}>
                                {note.note}
                            </Typography>
                        </Box>
                    ))}
                </Stack>
            }
            action={
                <Fragment>
                    <IconButton size="small" color="inherit" onClick={() => setOpen(false)}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Fragment>
            }
        />
    );
};
