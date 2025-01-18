"use State";
import {useState, useRef, useEffect} from "react";
import {Card,TextField,Container, Checkbox, FormControlLabel} from "@mui/material";

export function Scan({}){
    const textFieldRef = useRef(null);
    const [scan, setScan] = useState()
    const [reship, setReship] = useState(false)

    const isReship = ()=>{
        console.log(event.target.checked)
        if(event.target.checked) setReship(true)
        else setReship(false)
    }
    useEffect(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
        setInterval(()=>{
            if (textFieldRef.current) {
                textFieldRef.current.focus();
              }
        }, 2000)
      }, []);
    const label = { inputProps: { 'aria-label': 'Checkbox demo' } };
    return (
        <Container maxWidth="xxl" sx={{marginBottom: "1%"}}>
            <Card sx={{padding: "2%", width: "100%", display: "flex", flexDirection: "row"}}>
                <TextField label="Scan"  fullWidth inputRef={textFieldRef} autoFocus onChange={()=>{setScan(event.target.value)}} onKeyDown={()=>{if(event.key == 13 || event.key=="ENTER") setScan(event.target.value);}}/>
                <FormControlLabel
                    control={
                        <Checkbox
                        {...label}
                        checked={reship}
                        onClick={isReship}
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                        />
                    }
                    label="Reship"
                />
            </Card>
        </Container>
    )
}