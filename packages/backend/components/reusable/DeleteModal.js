import {Box, Button, Modal, Typography} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {useState} from "react";


export default function DeleteModal({open, setOpen, onDelete, title, deleteImage}) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        await onDelete(deleteImage);
        setLoading(false);
        setOpen(false);
    };

    return (
        <Modal open={open} onClose={() => setOpen(false)}>
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 500,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2
            }}>
                <Typography variant="h6" component="h2" gutterBottom>
                    {title || "Are you sure you want to delete this?"}
                </Typography>
                <Button variant="contained" color="error" onClick={handleDelete} disabled={loading}>
                    {loading ? "Deleting..." : "Delete"}
                </Button>
                <Button variant="outlined" onClick={() => setOpen(false)} startIcon={<CloseIcon />}>
                    Cancel
                </Button>
            </Box>
        </Modal>
    );
}