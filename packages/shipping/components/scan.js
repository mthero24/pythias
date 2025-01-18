"use State";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Box, Checkbox, FormControlLabel} from "@mui/material";

export function Scan({auto, setAuto}){
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
            onKeyDown={() => {
              if (event.key == 13 || event.key == "ENTER")
                setScan(event.target.value);
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