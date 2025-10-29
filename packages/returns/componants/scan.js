"use State";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Box, Checkbox, FormControlLabel} from "@mui/material";
import axios from "axios";
export function Scan({ setVariant, setInventory, auto, setAuto, }){
    const textFieldRef = useRef(null);
    const [scan, setScan] = useState()

    
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
            display: "flex",
            flexDirection: "row",
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
          
        </Card>
      </Box>
    );
}