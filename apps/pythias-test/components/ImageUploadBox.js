import { Box, IconButton } from "@mui/material";
import React, { useState } from "react";
import { FaWindowClose } from "react-icons/fa";
import Dropzone from "./Dropzone";
import ImageUpload from "./ImageUpload";
import { Add } from "@mui/icons-material";

const ImageUploadBox = ({
  onUploadComplete,
  shouldDisplayImage = true,
  onRemove,
  uploadDirectory = "test-uploads",
  sx ={},
  initialImage,
  onPreProcess
}) => {
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [image, setImage] = useState(initialImage);

  async function getBase64Image(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = function () {
        resolve(reader.result);
      };

      reader.onerror = function (error) {
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  }

  const handleImageUpload = async ({ file }) => {
    let ext = file.name.split(".")[1];
    let base64 = await getBase64Image(file);
    if(onPreProcess){
      base64 = await onPreProcess(base64)
    }
    if(uploadDirectory == 'test-uploads'){
     // console.log('**** USING TEST DIRECTORY')
    }
    setFilesToUpload([
      {
        base64,
        key: `${uploadDirectory}/${Date.now()}.${ext}`,
      },
    ]);
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
    setImage(undefined);
  };

  return (
    <Box
      sx={{
        border: "1px dashed black",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
        flexDirection:'column',
        height:'100%',
        borderRadius: 2,
        ...sx
      }}
    >
      {/* {image && (
        <Box sx={{ position: "relative", p:2 }}>
          <img src={image} className="img-fluid" />
          <Box
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              zIndex: 2,
            }}
          >
            {onRemove && (
              <IconButton aria-label="close" onClick={handleRemove}>
                <FaWindowClose color="red" />
              </IconButton>
            )}
          </Box>
        </Box>
      )} */}

     

        <Dropzone onUpload={(file) => handleImageUpload({ file })}></Dropzone>
      <ImageUpload
        filesToUpload={filesToUpload}
        onUploadComplete={(e) => {
          console.log(e);
          if (onUploadComplete) {
            onUploadComplete(e[0]);
          }
          if(shouldDisplayImage){
            setImage(e[0]);
          }
        }}
      />
    </Box>
  );
};

export default ImageUploadBox;
