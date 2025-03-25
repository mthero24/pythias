"use client";
import {Box, Card, Grid2, Typography, Button, Modal} from "@mui/material";
import {useState} from "react";
import CreatableSelect from "react-select/creatable";
import axios from "axios"
import Search from "@/app/admin/designs/Search";
import Image from "next/image";
export function Main({s}){
    const [sku, setSku] = useState(s)
    const [edit, setEdit] = useState(null)
    const [addDesign, setAddDesign] = useState(false)
    const [blank, setBlank] = useState(null)
    const [sizeColor, setSizeColor] = useState(false)
    return (
        <Box sx={{background: "#e2e2e2", padding: "3%"}}>
            <Typography sx={{fontSize: "2rem"}}>Fixable: {sku.length}</Typography>
            <Grid2 container spacing={2}>
            {sku.map((s,i)=>(
                <Grid2 size={3} key={s._id}>
                    <Card sx={{padding: "5%"}}>
                        <Typography sx={{padding: ".5%"}}>GTIN: {s.gtin}</Typography>
                        <Typography  sx={{padding: ".5%"}}>UPC: {s.upc}</Typography>
                        <Typography  sx={{padding: ".5%"}}>SKU: {s.sku}</Typography>
                        <Typography  sx={{padding: ".5%", cursor: "pointer", color: s.design? "#000": "blue"}} onClick={()=>{setEdit(s); setAddDesign(true)}}>Design: {s.design? s.design.name: "none"}</Typography>
                        <Typography  sx={{padding: ".5%"}}>Blank: {s.blank? s.blank.name: "none"}</Typography>
                        <Box sx={{cursor: "pointer", color: s.color? "#000": "blue"}} onClick={()=>{setBlank(s.blank); setEdit(s); setSizeColor(true) }}>
                            <Typography  sx={{padding: ".5%"}}>Color: {s.color? s.color.name: "none"}</Typography>
                            <Typography sx={{padding: ".5%"}}>Size: {s.size}</Typography>
                        </Box>
                        <Typography sx={{padding: ".5%"}}>Recycle: {s.recycle? "TRUE": "FALSE"}</Typography>
                    </Card>
                </Grid2>
            ))}
            </Grid2>
            <AddDesignModal open={addDesign} setOpen={setAddDesign} upc={edit} setUpc={setEdit} setSku={setSku} />
            <UpdateModal open={sizeColor} setOpen={setSizeColor} upc={edit} setUpc={setEdit} blank={blank} setBlank={setBlank} setSku={setSku}/>
        </Box>
    )
}

const AddDesignModal = ({open, setOpen, upc, setUpc, setSku})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        height: "90%",
        overflow: "auto",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };
      const [designs, setDesigns] = useState([])
      const [search, setSearch] = useState("")
      const [page, setPage] = useState(1)
      const [hasMore, setHasMore] = useState(true)
      const [design, setDesign] = useState()
      const updateItem = async ()=>{
        let res = await axios.put("/api/upc", {upc})
        if(res.data.error) alert(res.data.msg)
        else {
            setSku(res.data.skus)
            setUpc(null)
            setOpen(false)
            setSearch("")
            setDesigns([])
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{
            setOpen(false)
            setItem(null)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Update Item: {upc?.sku}
            </Typography>
            <Search setDesigns={setDesigns} search={search} setSearch={setSearch} setPage={setPage} setHasMore={setHasMore}/>
            <Grid2 container spacing={2} sx={{marginTop: "1%"}}>
                {designs && designs.map(d=>(
                    <Grid2 key={d._id} size={{xs: 6, sm: 4, md: 3}}>
                        <Box sx={{opacity: design == d._id? .5: 1,}} onClick={()=>
                            {
                                let i = {...upc}
                                i.recycle = false
                                i.design = d
                                setUpc({...i})
                                setDesign(d._id) 

                            }}>
                            <Card sx={{width: "100%", padding: "3%", borderRadius: "9px", cursor: "pointer", height: "100%"}}>
                                <Box sx={{padding: "1% 3%", maxHeight: "250px", minHeight: "250px", height: "250px", background: "#e2e2e2"}}>
                                    <Image src={d.images?.front? d.images.front: d.images?.back? d.images?.back: d.images?.leftSleeve? d.images?.leftSleeve: d.images?.rightSleeve? d.images?.rightSleeve: d.images?.pocket? d.images?.pocket: "/missingImage.jpg"} width={150} height={150} alt={`${d.name} ${d.sku} design`} style={{width: "100%", height: "auto", maxHeight: "250px", background: "#e2e2e2"}}/>
                                </Box>
                                <hr/>
                                <Box sx={{padding: "3%"}}>
                                    <Typography sx={{fontSize: '0.8rem', color: "black"}}>SKU: {d.sku}</Typography>
                                    <Typography sx={{fontSize: '0.8rem', color: "black"}}>{d.name}</Typography>
                                </Box>
                            </Card>
                        </Box>
                    </Grid2>
                ))}
            </Grid2>
            {hasMore && <Button onClick={()=>{setPage(page + 1)}} fullWidth>Next Page</Button>}
            <Button fullWidth onClick={()=>{updateItem()}}>Update Item</Button>
        </Box>
      </Modal>
    )
}

const UpdateModal = ({open, setOpen, upc, setUpc, blank, setBlank, setSku})=>{
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "90%",
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      };
    const handleSizeChange = (val)=>{
        let i = {...upc}
        i.size = val.value
        i.recycle = false
        setUpc({...i})
    }
    const handleColorChange = (val)=>{
        let i = {...upc}
        i.color = val.value
        i.recycle = false
        setUpc({...i})
    }
    const updateItem = async ()=>{
        let res = await axios.put("/api/upc", {upc})
        if(res.data.error) alert(res.data.msg)
        else {
            setSku(res.data.skus)
            setUpc(null)
            setBlank(null)
            setOpen(false)
        }
    }
    return (
        <Modal
        open={open}
        onClose={()=>{
            setOpen(false)
            setItem(null)
            setBlank(null)
            setSize(null)
            setColor(null)
        }}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
                Update Item: {upc?.sku}
            </Typography>
            <Box sx={{margin: "1% 0%"}}>
                <CreatableSelect
                    placeholder="Size"
                    value={upc?.size? {label: upc?.size, value: upc?.size}: null}
                    options={blank?.sizes.map(b=>{
                        return {label: b.name, value: b.name}
                    })}
                    onChange={(val)=>{
                        handleSizeChange(val)
                    }}
                />
            </Box>
            <Box sx={{margin: "1% 0%"}}>
                <CreatableSelect
                    placeholder="Color"
                    value={upc?.color? {label: upc?.color.name, value: upc?.color._id}: null}
                    options={blank?.colors.map(b=>{
                        return {label: b.name, value: b._id}
                    })}
                    onChange={(val)=>{
                        handleColorChange(val)
                    }}
                />
            </Box>
            <Button fullWidth onClick={()=>{updateItem()}}>Update Item</Button>
        </Box>
      </Modal>
    )
}