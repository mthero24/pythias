import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import axios from "axios";

export function DeleteInventoryModal({ open, setOpen, inventory, setInventory, setStyles, query, page, setExpandedColor }) {
    const router = useRouter();

    const handleDelete = async () => {
        const res = await axios.delete(`/api/admin/inventory?id=${inventory._id}&q=${query}&page=${page}`)
            .catch(e => console.log(e.response?.data));
        if (res?.data) setStyles([...res.data.blanks]);
        setOpen(false);
        setInventory(null);
        setExpandedColor("");
    };

    return (
        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle fontWeight={700}>Delete Inventory</DialogTitle>
            <DialogContent>
                <Typography>Are you sure you want to delete this inventory item? This cannot be undone.</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
            </DialogActions>
        </Dialog>
    );
}
