"use State";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Box, Button, MenuItem} from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import axios from "axios";
import { set } from "mongoose";

export function Scan({ blanks, setVariant, setInventory, auto, setAuto, }){
    const textFieldRef = useRef(null);
    const [scan, setScan] = useState()
    const [open, setOpen] = useState(false)
    const [blank,setBlank] = useState(null)
    const [color, setColor] = useState(null)
    const [size, setSize] = useState(null)
    const [design, setDesign] = useState(null)
    useEffect(() => {
        if(auto){
            if (textFieldRef.current) {
                textFieldRef.current.focus();
            }
            setAuto(false)
        }
      }, [auto]);
    const GetInfo = async ()=>{
      console.log("getInfo")
      setScan("")
      let res
      res = await axios.post(`/api/production/returns`, {upc: scan})
      console.log(res.data)
      if(res.data.error) return alert(res.data.msg)
      else {
        setVariant(res.data.variant)
        setInventory(res.data.productInventory)
      }
    }
    return (
      <Box
        sx={{
          margin: "2%"
        }}
      >
        <Card
          sx={{
            padding: "2%",
            width: "100%",
            
          }}
        >
          <TextField
            label="Scan"
            fullWidth
            inputRef={textFieldRef}
            autoFocus
            onChange={() => {
              setScan(event.target.value);
            }}
            value={scan}
            onKeyDown={() => {
              console.log(event.key, scan)
              if (event.key == 13 || event.key == "Enter" || event.key=="ENTER")
                GetInfo();
            }}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end"}}>
            <Button onClick={() => setOpen(!open)}>Find {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}</Button>
          </Box>
          <Box sx={{ display: open ? "flex" : "none", flexDirection: "row", gap: "1rem", justifyContent: "center", alignItems: "center" }}>
            <TextField
              select
              label="Blank"
              value={blank}
              onChange={(e) => setBlank(e.target.value)}
              sx={{width: "20%"}}
            >
              {blanks.map((b) => (
                <MenuItem key={b._id} value={b}>
                  {b.code}
                </MenuItem>
              ))}
            </TextField>
            {blank && (
              <TextField
                label="Color"
                select
                value={color}
                onChange={(e) => setColor( e.target.value)}
                sx={{width: "20%"}}
              >
                {blank.colors.map((c) => (
                  <MenuItem key={c._id} value={c}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {blank && (
              <TextField
                label="Size"
                select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                sx={{width: "20%"}}
              >
                {blank.sizes.map((s) => (
                  <MenuItem key={s._id} value={s}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {blank && (
              <TextField
                label="Design SKU"
                value={design ? design : ""}
                onChange={(e) => setDesign(e.target.value)}
                sx={{width: "20%"}}
              />
            )}
            {blank && color && size && design && <Button variant="contained" onClick={async ()=>{
              if(!blank || !color || !size || !design) return alert("Please select blank, color, size, and enter design SKU")
              setVariant(null)
              setInventory(null)
              let res = await axios.post(`/api/production/returns/find`, { blank: blank._id, color: color._id, size: size._id, designSku: design })
              console.log(res.data)
              setVariant(res.data.variant)
              setInventory(res.data.productInventory)
              setBlank(null)
              setColor(null)
              setSize(null)
              setDesign(null)
              setOpen(false)
            }}>Find Item</Button>}
          </Box>
        </Card>
      </Box>
    );
}