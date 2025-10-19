import {Modal, Typography, Box, Button, Grid2} from "@mui/material";
import { useRouter } from "next/navigation";
import axios from "axios";
export function DeleteBlankModal({open, setOpen,  blank,}) {
    const router = useRouter()
    const handleDelete = async () => {
        let res = await axios.delete(`/api/admin/blanks?id=${blank._id}`).catch(e => {
            console.log(e.response.data)
        });
        router.push("/admin/blanks");
    };
    return (
        <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
            <Box sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', border: '2px solid #000', boxShadow: 24, p: 4, }}>
                <Typography id="modal-modal-title" variant="h6" component="h2">Delete Blank</Typography>
                <Typography id="modal-modal-description" sx={{ mt: 2 }}>Are you sure you want to delete this blank?</Typography>
                <Box sx={{display: "flex", justifyContent: "flex-end", marginTop: 3}}>
                    <Button variant="contained" color="error" onClick={handleDelete} sx={{marginRight: 2}}>Delete</Button>
                    <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
                </Box>
            </Box>
        </Modal>
    )
}