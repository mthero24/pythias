"use State";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Box, Checkbox, FormControlLabel} from "@mui/material";
import axios from "axios";
export function Scan({auto, setAuto, setOrder, setItem, setBin, setShow}){
    const textFieldRef = useRef(null);
    const [scan, setScan] = useState()
    const [reship, setReship] = useState(false)

    const isReship = ()=>{
       // console.log(event.target.checked)
        if(event.target.checked) setReship(true)
        else setReship(false)
        setAuto(true)
    }
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
      let res = await axios.post("/api/production/shipping", {scan})
      if(res.data.error) console.log(res.data.msg)
      else {
        if (res.data.item) {
          setItem(res.data.item);
          setOrder(res.data.item.order);
        } else if (res.data.order) {
          setOrder(res.data.order);
        } else if (res.data.bin) {
          setOrder(res.data.bin.order);
          setBin(res.data.bin);
        }
        if(res.data.item || res.data.order || res.data.bin){
          setShow(true)
        }
        setScan("")
      }
    }
    const label = { inputProps: { 'aria-label': 'Checkbox demo' } };
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
          <FormControlLabel
            control={
              <Checkbox
                {...label}
                checked={reship}
                onClick={isReship}
                sx={{ "& .MuiSvgIcon-root": { fontSize: 28 }, marginLeft: "15%" }}
              />
            }
            label="Reship"
          />
        </Card>
      </Box>
    );
}