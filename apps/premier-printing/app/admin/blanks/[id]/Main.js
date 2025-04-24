"use client"
import { Typography, Container, Button, Modal, Box, TextField } from "@mui/material";
import axios from "axios";
import Link from "next/link";
import LoaderOverlay from "@/components/LoaderOverlay";
import {useState} from "react";
export function Main({style}){
    const [loading, setLoading] = useState(false);
    const [headingModal, setHeadingModal] = useState(false)
    const [heading, setHeading] = useState({})
    const [headingName, setHeadingName] = useState("")
    const handleDelete = async () => {
      if (confirm("Delete?")) {
        let result = await axios.delete(`/api/admin/blanks?id=${style._id}`, {id: style._id});
        location.replace("/admin/blanks");
      }
    };

    const generateInventory = async () => {
      setLoading(true);
      let result = await axios.post("/api/admin/blanks/generate-inventory", {
        id: style._id,
      });
      setLoading(false);
    };

    return (
      <Container maxWidth="lg">
        <div style={{ paddingBottom: 50 }}>
          <Typography variant="h4" component="h1" mb={3}>
            {style.code} - {style.name}
          </Typography>
          <div>
            <Typography variant="p">Sales: {style.sales}</Typography>
          </div>
          <div>
            <Typography variant="p">Vendor: {style.vendor}</Typography>
          </div>

          <div>
            <Link href={`/admin/blanks/create?id=${style._id}`}>
              <Button>Edit</Button>
            </Link>
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
            <a href={`/admin/blanks/production/${style._id}`}>
              <Button>Change Production Settings</Button>
            </a>

            <Button onClick={generateInventory}>
              Generate Missing Inventory
            </Button>
            <Button onClick={()=>{setHeadingModal(true); setHeading(style.kohlsHeader); setHeadingName("kohlsHeader")}}>
              Kohls CSV Headers
            </Button>
            <HeaderModal open={headingModal} setOpen={setHeadingModal} header={heading} setHeader={setHeading} style={style} headingName={headingName} />
          </div>
        </div>
        {loading && <LoaderOverlay />}
      </Container>
    );
}
const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: "96%",
  height: "90vh",
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};
const HeaderModal = ({open, setOpen, header, setHeader, headingName, style})=>{
  return(
    <Modal
      open={open}
      onClose={()=>{setOpen(false)}}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography id="modal-modal-title" variant="h6" component="h2" textAlign="center">
          {headingName}
        </Typography>
        <Box sx={{display: "flex", flexDirection: "column", alignContent:"center", alignItems: "center", padding: "3%"}}>
          <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start", width: "50%"}}>
              <TextField label="heading" fullWidth />
              <Typography sx={{padding: "2%"}}>:</Typography>
              <TextField label="value" fullWidth />
          </Box>
          <Button fullWidth>Save</Button>
          {Object.keys(header? header: {}).map(h=>(
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start", width: "50%"}} key={h}>
              <TextField label="heading" fullWidth value={h} />
              <Typography sx={{padding: "2%"}}>:</Typography>
              <TextField label="value" fullWidth value={header[h]} />
          </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  )
}