"use client"
import { Typography, Container, Button, Modal, Box, TextField } from "@mui/material";
import axios from "axios";
import Link from "next/link";
import LoaderOverlay from "@/components/LoaderOverlay";
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import {useState} from "react";
export function Main({blank}){
    const [loading, setLoading] = useState(false);
    const [headingModal, setHeadingModal] = useState(false)
    const [heading, setHeading] = useState({})
    const [headingName, setHeadingName] = useState("")
    const [style, setStyle] = useState(blank)
    console.log(blank.shopSimonHeader, "shopSimonHeader")
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
            <Button onClick={()=>{setHeadingModal(true); setHeading(style.targetHeader); setHeadingName("targetHeader")}}>
              Target CSV Headers
            </Button>
             <Button onClick={()=>{setHeadingModal(true); setHeading(style.shopSimonHeader); setHeadingName("shopSimonHeader")}}>
              Shop-Simon CSV Headers
            </Button>
            <Button onClick={()=>{setHeadingModal(true); setHeading(style.tikTokHeader); setHeadingName("tikTokHeader")}}>
              Tik Tok CSV Headers
            </Button>
            <HeaderModal open={headingModal} setOpen={setHeadingModal} header={heading} setHeader={setHeading} style={style} setStyle={setStyle} headingName={headingName} />
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
  overflow: "auto"
};
const HeaderModal = ({open, setOpen, header, setHeader, headingName, style, setStyle})=>{
  console.log(header)
  const [newItem, setNewItem] = useState({})
  const save = async()=>{
    let he = {...header}
    he[Object.keys(newItem)[0]] = newItem[Object.keys(newItem)[0]]
    console.log(style)
    console.log(he)
    style[headingName] = {...he}
    let res = await axios.post("/api/admin/blanks", {blank: style}) 
    console.log(res?.data)
    let it = {}
    setNewItem({"":""})
    setHeader({...res?.data.blank[headingName]})
    setStyle(res?.data.blank)
  }
  const setKey = ()=>{
    let it = {}
    it[event.target.value] = newItem[Object.keys(newItem)[0]]
    setNewItem({...it})
    console.log(it)
  }
  const setValue = ()=>{
    let it = {...newItem}
    it[Object.keys(it)[0]] = event.target.value
    setNewItem({...it})
    console.log(it)
  }
  const deleteValue = async (k)=>{
    let he = {}
    for(let key of Object.keys(header)){
      if(key != k ){
        he[key] = header[key]
      }
    }
    style[headingName] = {...he}
    let res = await axios.post("/api/admin/blanks", {blank: style}) 
    console.log(res?.data)
    setHeader({...res?.data.blank[headingName]})
    setStyle(res?.data.blank)
  }
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
              <TextField label="heading" fullWidth value={Object.keys(newItem)[0]} onChange={()=>{setKey()}}/>
              <Typography sx={{padding: "2%"}}>:</Typography>
              <TextField label="value" fullWidth value={newItem[Object.keys(newItem)[0]]} onChange={()=>{setValue()}}/>
          </Box>
          <Button fullWidth onClick={()=>{save()}} sx={{marginBottom: "3%"}}>Save</Button>
          {Object.keys(header? header: {}).map(h=>(
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-start", width: "55%", margin: "1%"}} key={h}>
              <TextField label="heading" fullWidth value={h} />
              <Typography sx={{padding: "2%"}}>:</Typography>
              <TextField label="value" fullWidth value={header[h]} />
              <DeleteForeverIcon sx={{color: "red", margin: "2% 0%", cursor: "pointer"}} onClick={()=>{deleteValue(h)}} />
          </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  )
}