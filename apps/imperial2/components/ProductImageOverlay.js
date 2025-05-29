import { Box, CircularProgress, Fade, FormControlLabel, Checkbox } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import MyBox from "./UI/Box";
//import { getFastlyLink } from "functions/getFastlyLink";
import axios from "axios"


const ProductImageOverlay = ({
  styleImage,
  box,
  id,
  style,
  colorName,
  defaultId,
  setDefaultImages,
  designImage = "https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png",
  imageGroup,
  side,
  dI
}) => {
  console.log(side, designImage)
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [base64, setBase64] = useState(null);

  // styleImage = getFastlyLink(styleImage, 700);
  // designImage = getFastlyLink(designImage, 300);

 

  useEffect(() => {
    let getRender = async ()=>{
      //let res = await axios.post("/api/renderImages", {box, designImage, styleImage, imageDimensions, width: 400})
      console.log(designImage, colorName)
      console.log(`http://localhost:3010/images?blank=${style}&blankImage=${styleImage}&side=${side}&colorName=${colorName.value}&design=${designImage}&width=400`)
      setBase64(`https://imperial.pythiastechnologies.com/api/renderImages/${style}-${side}.jpg?blank=${style}&blankImage=${styleImage}&side=${side}&colorName=${colorName.value? colorName.value: colorName}&design=${designImage}&width=400`)
    }
    getRender()
    
  }, [imageGroup]);


  return (
    <Box
      ref={containerRef}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flexDirection: "column"
      }}
    >
      {base64 && (
        <Fade in={true} timeout={750}>
          <img
            src={base64}
            alt="Product"
            className="img-fluid"
            crossOrigin="anonymous"
          />
        </Fade>
      )}
       {id && <Box>
              <FormControlLabel value={id} control={<Checkbox checked={id == dI} />} label="Set Default" onClick={()=>{setDefaultImages({id, side})}} />
            </Box>
        }
      {!base64 && (
        <MyBox
          position="absolute"
          jc="center"
          ai="center"
          top={0}
          left={0}
          right={0}
          bottom={0}
        >
          <CircularProgress size="1.25rem" color="inherit" />
        </MyBox>
      )}
    </Box>
  );
};

export default ProductImageOverlay;
