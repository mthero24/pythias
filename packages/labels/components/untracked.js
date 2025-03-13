"use client"
import {useState, useEffect} from "react";
import {Box, Button, FormControlLabel,Checkbox, Typography} from "@mui/material";
import axios from "axios";
export const UntrackedLabels = () => {
    const [labels, setLabels] = useState([]);
    const [selected, setSelected] = useState([]);
    const [selectedIds, setSelectedIds] = useState([])
  
    useEffect(() => {
      const getLabels = async () => {
        let result = await axios.get("/api/production/print-labels/untracked-labels", {});
        console.log(result.data)
        if(!result.data.error) setLabels(result.data);
      };
      getLabels();
    }, []);
  
    const handleToggleLabel = (item) => {
        let sid = [...selectedIds]
        let sit = [...selected]
        if(!sid.includes(item._id)) {
            sid.push(item._id)
            sit.push(item)
        }else{
            sid = sid.filter(s=> s != item._id)
            sit = sit.filter(i=> i._id != item._id)
        }
        console.log(sid.length, sit.length)
        setSelectedIds(sid)
        setSelected(sit);
    };
  
    const printSelected = async () => {
        console.log(selected, labels)
        let print = await axios.post("/api/production/print-labels", {
            type: "reprint",
            items: selected,
        });
    };
  
    return (
      <Box>
        <Button
          sx={{ my: 2 }}
          fullWidth
          variant="contained"
          onClick={printSelected}
        >
          Print Selected ({selected.length})
        </Button>
  
        <Button
          onClick={() => {
            setSelected(labels);
            setSelectedIds(labels.map(l=> l._id))
          }}
        >
          Select All
        </Button>
  
        {labels && labels.map((label) => (
          <Box w="100%" key={label._id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedIds.includes(label._id)}
                  onChange={() => handleToggleLabel(label)}
                />
              }
              label={
                <Box py={0} borderBottom={"1px solid #00000033"}>
                  <Typography fontWeight={800}>{label.pieceId}</Typography>
                  <Typography>{label.sku}</Typography>
                  <Typography fontSize={14} fontWeight={300}>
                    {label.labelPrintedDates.map(d=>(
                      new Date(d).toLocaleDateString("EN-us")
                    ))}
                  </Typography>
                </Box>
              }
            />
          </Box>
        ))}
      </Box>
    );
};