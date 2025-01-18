import {Box, TextField, Button, ButtonGroup} from "@mui/material";
import {useState} from "react"
import axios from "axios"
export function BinSettings({binCount, setAuto}){
    const [bins, setBins] = useState(binCount)
    const [disable, setDisable] = useState(true)
    const [update, setUpdate] = useState()
    const processUpdate = async()=>{
        console.log(bins, update)
        let type
        let execute
        if(bins < update) {
            type = "add";
            execute= true;
        }else{
            type= "subtract"
            execute= false
        }
        res = await axios.put("/api/shipping/bins", {binCount: bins, newCount: update, type, execute})
    }
    return (
      <Box
        sx={{ padding: ".5%", display: { xs: "none", md: "block" } }}
        onClick={() => {
          if(disable) setAuto(true);
        }}
      >
        <ButtonGroup variant="contained" aria-label="Basic button group">
          <TextField
            label="Number Of Bins"
            type="number"
            value={update ? update : bins}
            disabled={disable}
            onChange={() => {
              setUpdate(parseInt(event.target.value));
            }}
            onKeyDown={() => {
                console.log(event.key)
              if (event.key == 13 || event.key == "Enter") processUpdate();
            }}
          />
          <Button
            onClick={() => {
              setDisable(!disable);
              setAuto(!disable);
              setUpdate()
            }}
          >
            Edit
          </Button>
        </ButtonGroup>
      </Box>
    );
}