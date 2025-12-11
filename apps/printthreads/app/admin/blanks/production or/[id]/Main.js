"use client";
import {
  Typography,
  Container,
  Button,
  TextField,
  Grid2,
  Select,
  Divider,
  MenuItem,
  Box
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import  Text  from "@/components/UI/Text";
import  Row  from "@/components/UI/Row";
import { useFieldArray, useForm } from "react-hook-form";
export function Main({ blank, blanks }) {
  const [preset, setPreset] = useState("select");
  const {
    getValues,
    register,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      profiles: blank.profiles,
      pretreatments: blank.pretreatments,
      firefly: blank.firefly,
      envelopes: blank.envelopes,
      fold: blank.fold,
    },
  });

  useEffect(() => {
    if (preset && preset != "select") {
      setPresetSettings();
    }
  }, [preset]);

  const setPresetSettings = () => {
    console.log("setPresetSettings()");
    let found = blanks.filter((s) => s._id == preset)[0];
    if (found) {
      let envelopes = blank.sizes.map((size, i) => {
        let foundE = found.envelopes.filter(
          (f) => f?.sizeName?.toLowerCase() == size?.name?.toLowerCase()
        )[0];
        if (foundE) {
          return { ...foundE, sizeName: size.name, size: size._id };
        } else {
          let index = i;
          if (!found.envelopes[i]) {
            index = found.envelopes[found.envleopes.length - 1];
          }
          return {
            ...found.envelopes[index],
            size: size._id,
            sizeName: size.name,
          };
        }
      });

      let fold = blank.sizes.map((size) => {
        let foundE = found.fold.filter(
          (f) => f?.sizeName?.toLowerCase() == size?.name?.toLowerCase()
        )[0];

        console.log(foundE, "found");

        if (foundE) {
          return foundE;
        } else {
          return {
            ...found.fold[0],
            size: size._id,
            sizeName: size.name,
          };
        }
      });

      console.log(found.fold);

      reset({
        profiles: found.profiles,
        pretreatments: found.pretreatments,
        firefly: found.firefly,
      });
      replaceEnvelopes(envelopes);
      replaceFold(fold);
    }
  };

  const { fields: envelopeFields, replace: replaceEnvelopes } = useFieldArray({
    control,
    name: "envelopes",
  });

  const { fields: foldFields, replace: replaceFold } = useFieldArray({
    control,
    name: "fold",
  });

  const handleUpdate = async () => {
    let values = getValues();
    let result = await axios.post("/api/admin/blanks", {
      blank: { _id: blank._id, ...values },
    });
    alert(result.data);
    location.reload();
  };
  const generateSettings = async()=>{
    let sides = ["front", "back", "sleeve", "pocket", "hood", "leg", "side"];
    if(!blank.envelopes) blank.envelopes = []
    if(!blank.fold) blank.fold = []
    console.log(blank.sizes)
    for(let s of blank.sizes){
        for(let si of sides){
            let exists = blank.envelopes.filter(s=> s.sizeName == s.name && placement == si)[0]
            console.log(exists)
            if(!exists) blank.envelopes.push({size: s._id, sizeName: s.name, placement: si, width: 12, height: 12, vertoffset: 0, horizoffset: 0, platen: 2})
        }
        let exists = blank.envelopes.filter(
          (s) => s.sizeName == s.name && placement == si
        )[0];
        if(!exists) blank.fold.push({size: s._id, sizeName: s.name, fold: "temp", sleeves: 0, body: 0})
    }
    console.log(blank.fold, blank.envelopes)
    let result = await axios.post("/api/admin/blanks", {
      blank: { _id: blank._id, fold: blank.fold, envelopes: blank.envelopes },
    });
    alert(result.data);
    location.reload();
  }
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
          <Box>
            <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
              <MenuItem value={"select"}>Select A Preset</MenuItem>
              {blanks
                .sort((a, b) => a.code.localeCompare(b.code))
                .map((blank) => (
                  <MenuItem value={blank._id} key={blank._id}>
                    {blank.code}
                  </MenuItem>
                ))}
            </Select>
          </Box>
          <Box>
            <Button onClick={generateSettings}>Generate Settings</Button>
          </Box>
        </Box>
        <Divider sx={{ margin: "1%" }} />
        <EnvelopeSettings
          register={register}
          blank={blank}
          fields={envelopeFields}
        />
        <Divider sx={{ margin: "1%" }} />

        <FoldSettings register={register} blank={blank} fields={foldFields} />
        <Divider sx={{ margin: "1%" }} />
      </Box>
      <Box position="fixed" right={12} bottom={12}>
        <Button variant="contained" onClick={handleUpdate}>
          Update Production Settings
        </Button>
      </Box>
    </Container>
  );
}
const FoldSettings = ({ register, blank, fields }) => {
  console.log(fields, "fields");
  return (
    <Box>
      <Text>Fold Settings</Text>
      <Divider sx={{ margin: "1%" }} />
      {fields.map((p, i) => {
        const hide = ["_id", "id", "size", "sizeName"];
        let keys = Object.keys(p).filter((k) => !hide.includes(k));
        console.log(p.size, p.sizeName);
        let sizeName = blank.sizes.filter(
          (s) =>
            s?.name?.toLowerCase() == p?.size?.toLowerCase() ||
            s?.name?.toLowerCase() == p?.sizeName?.toLowerCase()
        )[0];
        if (sizeName) {
          sizeName = sizeName.name;
        }
        return (
          <Box key={p._id}>
            <Typography>Size - {sizeName}</Typography>
            <Grid2 container spacing={1}>
              {keys.map((key) => (
                <Grid2 size={4} key={key}>
                  <Typography>{key}</Typography>
                  <TextField fullWidth {...register(`fold.${i}.${key}`, {})} />
                </Grid2>
              ))}
            </Grid2>
          </Box>
        );
      })}
    </Box>
  );
};

const FireflySettings = ({ register, fields }) => {
  return (
    <Box>
      {fields.map((p, i) => (
        <Box key={p._id}>
          <Typography>{p.type}</Typography>
          <Grid2 container spacing={1}>
            <Grid2 size={4}>
              <Typography>{"Cure Temp"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.cureTemp`, { valueAsNumber: true })}
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography>{"cure time"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.cureTime`, { valueAsNumber: true })}
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography>{"exhaust"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.exhaust`, { valueAsNumber: true })}
              />
            </Grid2>

            <Grid2 size={4}>
              <Typography>{"Cooler"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.cooler`, { valueAsNumber: true })}
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography>{"Convection Top"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.convectionTop`, {
                  valueAsNumber: true,
                })}
              />
            </Grid2>
            <Grid2 size={4}>
              <Typography>{"convectionBottom"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.convectionBottom`, {
                  valueAsNumber: true,
                })}
              />
            </Grid2>

            <Grid2 size={4}>
              <Typography>{"pressTime"}</Typography>
              <TextField
                type="number"
                {...register(`firefly.${i}.pressTime`, { valueAsNumber: true })}
              />
            </Grid2>
          </Grid2>
        </Box>
      ))}
    </Box>
  );
};

const EnvelopeSettings = ({ register, blank, fields }) => {
  return (
    <Box>
      <Typography fontWeight={700}>Set Envelopes</Typography>
      <Divider sx={{ margin: "1%" }} />
      {fields.map((p, i) => {
        const hide = [
          "_id",
          "id",
          "size",
          "sizeName",
          "fold",
          "sleeves",
          "body",
        ];
        let keys = Object.keys(p).filter((k) => !hide.includes(k));
        let sizeName = blank.sizes.filter((s) => s._id == p.size)[0];
        if (sizeName) {
          sizeName = sizeName.name;
        }
        console.log(blank.sizes, p.size);

        return (
          <Box key={i}>
            <Divider sx={{ margin: "1%" }} />
            <Typography>Size - {sizeName}</Typography>
            <Grid2 container spacing={1}>
              {keys.map((key) => (
                <Grid2 size={2} key={key}>
                  <Typography>{key}</Typography>
                  <TextField
                    type={key == "placement" ? "string" : "number"}
                    {...register(`envelopes.${i}.${key}`, {
                      valueAsNumber: key == "placement" ? false : true,
                    })}
                  />
                </Grid2>
              ))}
            </Grid2>
            <hr />
          </Box>
        );
      })}
    </Box>
  );
};

const PretreatmentSettings = ({ register, fields }) => {
  return (
    <Box>
      <Typography fontWeight={700}>Set Pretreatment</Typography>
      <Grid2 container gap={1}>
        {fields.map((p, i) => (
          <Box key={p._id}>
            <Typography>{p.type}</Typography>
            <Grid2 container spacing={1}>
              <Grid2 item>
                <Typography>{"fluid"}</Typography>
                <TextField
                  type="number"
                  {...register(`pretreatments.${i}.fluid`, {
                    valueAsNumber: true,
                  })}
                />
              </Grid2>
              <Grid2 item>
                <Typography>{"density"}</Typography>
                <TextField
                  type="number"
                  {...register(`pretreatments.${i}.density`, {
                    valueAsNumber: true,
                  })}
                />
              </Grid2>
              <Grid2 item>
                <Typography>{"passes"}</Typography>
                <TextField
                  type="number"
                  {...register(`pretreatments.${i}.passes`, {
                    valueAsNumber: true,
                  })}
                />
              </Grid2>
            </Grid2>
          </Box>
        ))}
      </Grid2>
    </Box>
  );
};

const ProfileSettings = ({ register, fields }) => {
  return (
    <Box>
      <Row>
        <Typography fontWeight={700}>Set Profile</Typography>
      </Row>
      <Grid2 container gap={1}>
        {fields.map((p, i) => (
          <Box key={p._id}>
            <Typography>{p.type}</Typography>
            <Grid2 container spacing={1}>
              <Grid2 item>
                <Typography>{"Mask"}</Typography>
                <TextField
                  type="number"
                  {...register(`profiles.${i}.mask`, { valueAsNumber: true })}
                />
              </Grid2>
              <Grid2 item>
                <Typography>{"Highlight"}</Typography>
                <TextField
                  type="number"
                  {...register(`profiles.${i}.highlight`, {
                    valueAsNumber: true,
                  })}
                />
              </Grid2>
            </Grid2>
          </Box>
        ))}
      </Grid2>
    </Box>
  );
};