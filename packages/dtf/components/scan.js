"use State";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Box, Checkbox, FormControlLabel} from "@mui/material";
import axios from "axios";
export function Scan({ setSubmitted, auto, setAuto, printer, type}){
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
      console.log("getInfo", "this info")
      setScan("")
      let res
      setSubmitted(null)
      if(type == "send") res = await axios.post(`/api/production/dtf`, {pieceId: scan, printer})
      else res = await axios.get(`/api/production/dtf?pieceID=${scan}`)
      if(res.data.error) return alert(res.data.msg)
      else {
        console.log(res.data.centerDesign)
        setSubmitted(res.data);
      }
    }
    return (
      <Box
        sx={{
          marginBottom: "1%",
          width: { xs: "99%", sm: "96%", md: "90%" },
          marginLeft: { xs: ".5%", sm: "2%", md: "5%" },
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