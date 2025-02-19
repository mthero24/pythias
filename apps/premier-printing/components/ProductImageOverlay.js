import { Box, CircularProgress, Fade } from "@mui/material";
import { createCanvas } from "canvas";
import React, { useEffect, useRef, useState } from "react";
import MyBox from "./UI/Box";
//import { getFastlyLink } from "functions/getFastlyLink";
import "jimp";
import axios from "axios"


const ProductImageOverlay = ({
  styleImage,
  box,
  designImage = "https://upload.wikimedia.org/wikipedia/commons/c/ca/1x1.png",
  imageGroup
}) => {
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
      let res = await axios.post("/api/renderImages", {box, designImage, styleImage, imageDimensions})
      if(res.data.base64) setBase64(res.data.base64)
    }
    getRender()
    setBase64(null)
  }, [imageGroup]);

  const updateDimensions = async () => {
    if (containerRef.current) {
      let width = containerRef.current.offsetWidth;
      let height = containerRef.current.offsetHeight;

      setDimensions({
        width: Math.min(width, height),
        height: Math.min(width, height),
      });
    }

    let img = new Image();
    img.crossOrigin = "anonymous";
    if (box?.autoFit) {
      console.log("autoFit :)");
      let jimp = await Jimp.read(designImage);
      jimp = await jimp.autocrop({ cropOnlyFrames: false });
      designImage = await jimp.getBase64Async(Jimp.MIME_PNG);
    }
    img.src = designImage;
    img.onload = () => {
      if (box?.autoFit) {
      }
      setImageDimensions({
        width: img.width,
        height: img.height,
      });
    };
  };

  const drawImages = () => {
    console.log(styleImage, box, "draw image styleImage")
    if (!styleImage) return null;
    if (!box) return null;

    const canvas = createCanvas(dimensions.width, dimensions.height);
    const ctx = canvas.getContext("2d");
    const scale = dimensions.width / box.containerWidth;
    const boxWidth = box.boxWidth * scale;
    const boxHeight = box.boxHeight * scale;
    let imageW, imageH;
    let imageAspectRatio = imageDimensions.width / imageDimensions.height;
    const boxAspectRatio = boxWidth / boxHeight;

    if (imageAspectRatio > boxAspectRatio) {
      imageW = boxWidth;
      imageH = boxWidth / imageAspectRatio;
    } else {
      imageH = boxHeight;
      imageW = boxHeight * imageAspectRatio;
    }

    const background = new Image();
    background.crossOrigin = "anonymous";
    background.src = styleImage;
    background.onload = async () => {
      console.log("background loaded")
      try {
        // Draw the background image
        ctx.drawImage(background, 0, 0, dimensions.width, dimensions.height);

        // Draw the design image
        // const design = new Image();
        // design.crossOrigin = "anonymous";
        // if (box?.autoFit) {
        //   console.log("autoFit :)");
        //   let jimp = await Jimp.read(designImage);
        //   jimp = await jimp.autocrop({ cropOnlyFrames: false });
        //   designImage = await jimp.getBase64Async(Jimp.MIME_PNG);
        // }
        // design.src = designImage;
        // design.onload = () => {
        //   let designX = box.x * scale; // Default x position
        //   let designY = box.y * scale;

        //   // Center the design image horizontally if its width is less than the box width
        //   if (imageW < boxWidth) {
        //     const centerX = boxWidth / 2 - imageW / 2; // Calculate center position
        //     designX += centerX; // Adjust x position for centering
        //   }

        //   if (box?.autoFit) {
        //     //center the design verticall if less than box height!
        //     if (imageH < boxHeight) {
        //       const centerY = boxHeight / 2 - imageH / 2; // Calculate center position
        //       designY += centerY; // Adjust y position for centering
        //     }
        //   }

        //   ctx.drawImage(design, designX, designY, imageW, imageH);
        //   const base64Image = canvas.toDataURL();
        //   console.log(base64Image)
        //   setBase64(base64Image);
        // };
        // ctx.drawImage(design, designX, designY, imageW, imageH);
        const base64Image = canvas.toDataURL();
        console.log(base64Image)
        setBase64(base64Image);
      } catch (err) {
        console.log(err);
      }
    };
  };

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
      }}
    >
      {base64 && base64.length > 0 && (
        <Fade in={true} timeout={750}>
          <img
            src={base64}
            alt="Product"
            className="img-fluid"
            crossOrigin="anonymous"
          />
        </Fade>
      )}

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
