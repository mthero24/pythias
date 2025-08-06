import {Modal, Box, Typography, Button, Card, List, ListItem, ListItemText, Grid2, Grid} from '@mui/material';
import {useState, useEffect, use} from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

export const CreateNFProduct = ({open, setOpen, setProducts}) => {
    const [type, setType] = useState("From Blank");
    const [blanks, setBlanks] = useState([]);
    const [product, setProduct] = useState({});
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchBlanks = async () => {
            try {
                const response = await axios.get('/api/admin/blanks');
                setBlanks(response.data.blanks);
            } catch (error) {
                console.error("Error fetching blanks:", error);
            }
        };
        if(open) {
            fetchBlanks();
        }
    },[open])
    let style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        overflow: "auto"
    }

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", padding: "1%"}}>
                    <CloseIcon onClick={() => setOpen(false)} sx={{ cursor: "pointer", color: "#780606"}} />
                </Box>
                <Typography variant="h5" textAlign="center">Create New Product</Typography>
                <Box sx={{padding: "2%", marginBottom: "2%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
                    <Button fullWidth variant="outlined" sx={{background: type== "From Blank" ? "#e2e2e2" : "transparent"}} onClick={() => setType("From Blank")}>From Blank</Button>
                    <Button fullWidth variant="outlined" sx={{background: type== "Other" ? "#e2e2e2" : "transparent"}} onClick={() => setType("Other")}>Other</Button>
                </Box>
                {type === "From Blank" && (
                    <Box>
                        {/* Render blank selection UI here */}
                        <Grid2 container spacing={2}>
                            {blanks.map((blank) => {
                                let color = blank.colors && blank.colors.length > 0 ? blank.colors[0] : null;
                                for(let b of Object.keys(blank.multiImages)){
                                    if(b.color && b.color._id.toString() == color?._id.toString()){
                                        color = b.color;
                                    }
                                }
                                return (
                                    <Grid2 size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={blank._id}>
                                        <Card sx={{marginBottom: "1%", padding: "1%", width: "100%"}}>
                                           <Box>
                                               <img src={color && color.image ? color.image : "/no-image.png"} alt={blank.name} style={{ width: "100%", height: "200px", objectFit: "contain" }} />
                                           </Box>
                                            <Typography variant="body2" textAlign="center" sx={{whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{blank.name}</Typography>
                                        </Card>
                                    </Grid2>
                                );
                            })}
                        </Grid2>
                    </Box>
                )}
                {type === "From Design" && (
                    <Box>
                        {/* Render design selection UI here */}
                    </Box>
                )}
            </Box>
        </Modal>
    );
}