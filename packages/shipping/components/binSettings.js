import {Box, TextField, Button, ButtonGroup, Card, Typography, Modal, Grid2} from "@mui/material";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import CloseIcon from "@mui/icons-material/Close";
import {useState} from "react"
import axios from "axios"
export function BinSettings({binCount, setAuto, setBinss, modalStyle}){
    const [bins, setBins] = useState(binCount);
    const [disable, setDisable] = useState(true);
    const [update, setUpdate] = useState();
    const [showBinMove, setShowBinMove] = useState(false);
    const [binsMoved, setBinsMoved] = useState({})
    const processUpdate = async()=>{
        console.log(bins, update)
        let type
        let execute
        if(bins < update) {
            type = "add";
            execute = true
        }else{
            type= "subtract"
            execute= false
        }
        let res = await axios.put("/api/production/shipping/bins", {binCount: bins, newCount: update, type, execute}).catch(e=>{console.log(e.response.data)})
        if(res.data.error) alert(res.data.msg)
        if(type == "add"){
          setBinss(res.data.bins)
          setBins(res.data.binCount)
          setDisable(true)
          setAuto(true)
        }if(type == "subtract"){
            //setBinss(res.data.bins);
            setBins(res.data.binCount);
            if(Object.keys(res.data.movedBins).length > 0){
              setBinss(res.data.bins);
              setBinsMoved(res.data.movedBins);
              setShowBinMove(true)
              setDisable(true);
            }else{
              setBinss(res.data.bins);
              setBins(res.data.binCount);
              setDisable(true);
              setAuto(true);
            }
        }
    }
    return (
      <Box
        sx={{ padding: ".5%", display: { xs: "none", md: "block" } }}
        onClick={() => {
          if (disable) setAuto(true);
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
              console.log(event.key);
              if (event.key == 13 || event.key == "Enter") processUpdate();
            }}
          />
          <Button
            onClick={() => {
              setDisable(!disable);
              setAuto(!disable);
              setUpdate();
            }}
          >
            Edit
          </Button>
        </ButtonGroup>
        <Modal
          open={showBinMove}
          onClose={() => {
            setShowBinMove(false);
            setAuto(true);
          }}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={modalStyle}>
            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", marginTop: "-2%", marginBottom: "1%"}}>
              <CloseIcon onClick={()=>{setShowBinMove(false);
              setAuto(true);}} sx={{cursor: "pointer"}}/>
            </Box>
            <Card
              sx={{
                height:
                  typeof window !== "undefined"
                    ? window.innerHeight - 200
                    : 500,
                overflow: "auto",
              }}
            >
              <Typography
                textAlign={"center"}
                fontSize="2.5rem"
                fontWeight="bold"
              >
                Move Bins
              </Typography>
              {Object.keys(binsMoved).map((m, i) => (
                <Card
                  key={m}
                  sx={{
                    padding: "2%",
                    background: i % 2 == 0 ? "#d2d2d2" : "#e2e2e2",
                    margin: '.2%'
                  }}
                >
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 4, sm: 2 }}>
                      <Typography
                        textAlign={"center"}
                        fontSize="2.5rem"
                        fontWeight="bold"
                      >
                        {m.replace("mb", "")}
                      </Typography>
                    </Grid2>
                    <Grid2 size={{ xs: 4, sm: 8 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                          marginTop: {xs: "35%", sm:"4%", md: "2%"},
                        }}
                      >
                        <DoubleArrowIcon />
                        <DoubleArrowIcon
                          sx={{
                            display: { xs: "none", sm: "block", md: "block" },
                          }}
                        />
                        <DoubleArrowIcon
                          sx={{
                            display: { xs: "none", sm: "none", md: "block" },
                          }}
                        />
                        <DoubleArrowIcon
                          sx={{
                            display: { xs: "none", sm: "block", md: "block" },
                          }}
                        />
                        <DoubleArrowIcon
                          sx={{
                            display: { xs: "none", sm: "block", md: "block" },
                          }}
                        />
                        <DoubleArrowIcon
                          sx={{
                            display: { xs: "none", sm: "block", md: "block" },
                          }}
                        />
                        <DoubleArrowIcon
                          sx={{
                            display: { xs: "none", sm: "block", md: "block" },
                          }}
                        />
                      </Box>
                    </Grid2>
                    <Grid2 size={{ xs: 4, sm: 2 }}>
                      <Typography
                        textAlign={"center"}
                        fontSize="2.5rem"
                        fontWeight="bold"
                      >
                        {binsMoved[m]}
                      </Typography>
                    </Grid2>
                  </Grid2>
                </Card>
              ))}
            </Card>
          </Box>
        </Modal>
      </Box>
    );
}