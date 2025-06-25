"use client";
import {
  Typography,
  Container,
  Button,
  TextField,
  Grid2,
  Select,
  Divider,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box
} from "@mui/material";
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useEffect, useState } from "react";
import axios from "axios";
import  Text  from "@/components/UI/Text";
import  Row  from "@/components/UI/Row";
import { useFieldArray, useForm } from "react-hook-form";
export function Main({ bla }) {
  
  const [blank, setBlank] = useState(bla)
  const save = async (blank)=>{
    let result = await axios.post("/api/admin/blanks", { blank });
  }
  const handleUpdateEnvelope = async ({pl, size, key}) => {
    console.log(pl, size, key)
    let b = {...blank}
    if(!size){
      let envelopes = b.envelopes.filter(e=> e.placement == pl.name)
      for(let e of envelopes){
        e[key] = event.target.value
      }
    }else{
      let envelopes = b.envelopes.filter(e=> e.placement == pl.name && e.sizeName == size)
      for(let e of envelopes){
        e[key] = event.target.value
      }
    }
    setBlank({...b})
    save({...b})
  };
  return (
    <Container maxWidth="md">
      <Box space={8} pb={5}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text fontSize={24} fontWeight={600}>
            {blank.name} | {blank.code}
          </Text>
        </Box>
        <Divider sx={{ margin: "1%" }} />
        <EnvelopeSettings
          blank={blank}
          handleUpdateEnvelope={handleUpdateEnvelope}
        />
        <Divider sx={{ margin: "1%" }} />

        <FoldSettings blank={blank} setBlank={setBlank} save={save} />
      </Box>
      
    </Container>
  );
}
const FoldSettings = ({ blank, setBlank, save}) => {
  return (
    <Box>
      <Text>Fold Settings</Text>
      {blank.fold.map((f)=>(
         <Accordion key={f._id}>
          <AccordionSummary
            expandIcon={<ArrowDownwardIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            <Typography component="span">{f.sizeName}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid2 container spacing={1}>
                {Object.keys(f).filter(k=> k!= "size" && k!= "sizeName" && k!="_id").map((key) => (
                  <Grid2 size={4} key={key}>
                  <TextField fullWidth label={key} value={f[key]} onChange={()=>{
                    let b = {...blank}
                    let fold = b.fold.filter(fl=> fl._id.toString() == f._id.toString())[0]
                    fold[key] = event.target.value
                    console.log(fold)
                    setBlank({...b})
                    save({...b})
                  }}/>
                </Grid2>
              ))}
            </Grid2>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
  // return (
  //   <Box>
  //     <Text>Fold Settings</Text>
  //     <Divider sx={{ margin: "1%" }} />
  //     {fields.map((p, i) => {
  //       const hide = ["_id", "id", "size", "sizeName"];
  //       let keys = Object.keys(p).filter((k) => !hide.includes(k));
  //       console.log(p.size, p.sizeName);
  //       let sizeName = blank.sizes.filter(
  //         (s) =>
  //           s?.name?.toLowerCase() == p?.size?.toLowerCase() ||
  //           s?.name?.toLowerCase() == p?.sizeName?.toLowerCase()
  //       )[0];
  //       if (sizeName) {
  //         sizeName = sizeName.name;
  //       }
  //       return (
  //         <Box key={p._id}>
  //           <Typography>Size - {sizeName}</Typography>
  //           <Grid2 container spacing={1}>
  //             {keys.map((key) => (
  //               <Grid2 size={4} key={key}>
  //                 <Typography>{key}</Typography>
  //                 <TextField fullWidth {...register(`fold.${i}.${key}`, {})} />
  //               </Grid2>
  //             ))}
  //           </Grid2>
  //         </Box>
  //       );
  //     })}
  //   </Box>
  // );
};


const EnvelopeSettings = ({ blank, handleUpdateEnvelope}) => {
  let keys=["platen", "width", "height", "vertoffset", "horizoffset"]
  return (
    <Box>
      <Typography fontWeight={700}>Set Envelopes</Typography>
      {blank.printLocations?.map(pl=>(
        <Box key={pl._id}>
          <Accordion sx={{margin: "1%"}}>
            <AccordionSummary
              expandIcon={<ArrowDownwardIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Box sx={{display: "flex", flexDirection: "column"}}>
                <Typography component="span">{pl.name}</Typography>
                <Box>
                    <Grid2 container spacing={1}>
                        {keys.map((key)=>(
                          <Grid2 size={2.4} key={key}>
                            <TextField
                              label={key}
                              type={"number"}
                              value={blank.envelopes.filter(e=> e.placement == pl.name)[0][key]}
                              onChange={()=>{handleUpdateEnvelope({pl, key})}}
                            />
                          </Grid2>
                        ))}
                    </Grid2>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {blank.sizes.map((s)=>(
                <Box key={s._id}>
                    <Typography>{s.name}</Typography>
                    <Grid2 container spacing={1}>
                        {keys.map((key)=>(
                          <Grid2 size={2.4} key={key}>
                            <TextField
                              label={key}
                              type={key == "placement" ? "string" : "number"}
                              value={blank.envelopes.filter(e=> e.placement == pl.name && e.sizeName == s.name)[0]? blank.envelopes.filter(e=> e.placement == pl.name && e.sizeName == s.name)[0][key]: null}
                              onChange={()=>{handleUpdateEnvelope({pl, size: s.name, key})}}
                            />
                          </Grid2>
                        ))}
                    </Grid2>
                </Box>
              ))}
            </AccordionDetails>
          </Accordion>
        </Box>
      ))}
    </Box>
  );
};

