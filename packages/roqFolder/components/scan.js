"use client";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Box, Checkbox, FormControlLabel, Typography} from "@mui/material";
import axios from "axios";
export function Scan({auto, setAuto, setItem}){
    const textFieldRef = useRef(null);
    const [scan, setScan] = useState()
    const [shipSingles, setShipSingles] = useState(true)
    const [error, setError] = useState()
    const [scans, setScans] = useState([])
    const hasError = async (e)=>{
      for(let i = 0; i< 51; i++){
        setError(i % 2 == 0? e: null)
        await new Promise((resolve)=>{
          setTimeout(()=>{
            resolve()
          },300)
        })
      }
    }
    const isShipSingles = ()=>{
       // console.log(event.target.checked)
        if(event.target.checked) setShipSingles(true)
        else setShipSingles(false)
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
      setError(null)
      setItem(null)
      if(scan.length > 0 && !scans.includes(scan)){
        if(scans.length > 0){
          setScans([...scans.pop(), scan])
        }else{
          setScans([scan])
        }
        let res = await axios.post("/api/production/roq-folder", {scan, shipSingles})
        console.log(res.data)
        if(res.data.error) {
          hasError(res.data.msg)
          setItem()
          setScan("")
        }
        else {
            setItem(res.data.item)
            setScan("")
            setError(null)
        }
      }else{
        setScan("")
        if(scans.length > 0){
          setScans([...scans.pop()])
        }
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
                checked={shipSingles}
                onClick={isShipSingles}
                sx={{ "& .MuiSvgIcon-root": { fontSize: 28 }, marginLeft: "15%" }}
              />
            }
            label="Ship Singles"
          />
        </Card>
        {error &&  <Typography variant="h1" sx={{fontSize: "2rem", textAlign: "center", padding: "10%", color: "#B22222"}}>{error}!</Typography>}
      </Box>
    );
}