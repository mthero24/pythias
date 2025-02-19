"use client";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Grid2,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Dropzone from "@/components/Dropzone";
import { Cropper } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { FaWindowClose } from "react-icons/fa";
import ImageUpload from "@/components/ImageUpload";
import slugify from "@/utils/slugify";
import Select from "react-select";
import EyeDropper from "@/components/EyeDropper";
import CreatableSelect from "react-select/creatable";
import "jimp";
export const ColorImage = ({
    color,
    cropBoxData,
    onUploadImage,
    images,
    setImages,
    activePrintAreas,
    overridePrintBox,
    box,
    blank,
    colorCropBoxData,
    imageGroups,
    setImageGroups
  }) => {
    const [imageToCrop, setImageToCrop] = useState();
    const cropperRef = useRef();
    const imageType = useRef();
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [col, setCol] = useState(color);
    const [activeColorId, setActiveColorId] = useState();
  
    function getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    }
  
    useEffect(() => {
      if (onUploadImage) {
        onUploadImage(images);
      }
    }, [images]);
  
    const handleImageUpload = async ({ type, file }) => {
      let result = await getBase64(file);
      imageType.current = type;
      setImageToCrop(result);
    };
  
    const onCrop = (img) => {
      //console.log("onCrop");
      const cropper = cropperRef.current?.cropper;
      cropBoxData.current[imageType.current] = cropper.getCropBoxData();
      let base64 = cropper.getCroppedCanvas().toDataURL();
      setFilesToUpload([{ base64, key: `styles/${Date.now()}.png` }]);
      setImageToCrop(false);
    };
  
    const onUploadComplete = (urls) => {
        console.log("upload complete", imageType.current)
        let im = {...images}
        console.log(im)
        im[imageType.current].push({color: col._id, image: urls[0]})
        console.log(im)
        setImages({...im})
    };
  
    const updateColor = async (newColor) => {
      //console.log("updateColor()");
      setCol({ ...col, ...newColor });
      let result = await axios.put("/api/admin/colors", {
        color_id: color._id,
        ...newColor,
      });
    };
  
    useEffect(() => {
      setTimeout(() => {
        let cropper = cropperRef.current?.cropper;
        if (cropper && cropBoxData.current) {
          //console.log("settting crop box");
          cropper.setCropBoxData(cropBoxData.current[imageType.current]);
        }
      }, 50);
    }, [imageToCrop]);
  
    const BoxPreview = ({ side }) => {
      let boxToUse = box["default"] && box["default"][side];
      if (box[color._id] && box[color._id][side]) {
        boxToUse = box[color._id][side];
      }
      if (boxToUse) {
        let scale = 200 / boxToUse.containerHeight;
        return (
          <Box
            sx={{
              position: "absolute",
              opacity: 0.7,
              background: "red",
              width: boxToUse.boxWidth * scale,
              height: boxToUse.boxHeight * scale,
              top: boxToUse.y * scale,
              left: boxToUse.x * scale,
            }}
          ></Box>
        );
      }
      return null;
    };
  
    return (
      <>
        <Box>
          <Box sx={{ borderBottom: "1px solid #00000033", py: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                key={Date.now()}
                sx={{
                  width: 24,
                  height: 24,
                  background: col.image
                    ? `url('${col.image}?d=${Date.now()}')`
                    : col.hexcode,
                  backgroundSize: "contain",
                  mr: 2,
                }}
              ></Box>
              <Typography sx={{}}>{color.name}</Typography>
              <EyeDropper
                onColorChange={(hex) =>
                  updateColor({ hexcode: hex, image: null })
                }
              />
              <Select
                options={["light", "dark"].map((l) => ({ label: l, value: l }))}
                value={{ value: col.color_type, label: col.color_type }}
                onChange={({ value }) => updateColor({ color_type: value })}
              />
              <Button onClick={() => setActiveColorId(color._id)}>
                Set Color Swatch
              </Button>
            </Box>
            <Grid2 container spacing={2}>
                {activePrintAreas.map((type) => (
                    <Grid2 size={12} key={type}>
                        <div>{type}</div>
                        <Grid2 container spacing={2}>
                            <Grid2 size={{xs: 6, sm:4, md: 2}}>
                                <Box
                                    sx={{
                                    border: "1px dashed black",
                                    width: 200,
                                    height: 200,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    display: "flex",
                                    }}
                                >
                                    <Dropzone
                                        onUpload={(file) => handleImageUpload({ file, type })}
                                    ></Dropzone>
                                </Box>
                            </Grid2>
                            {images[type].filter(i=> i.color == col._id.toString()).map((i, j)=>(
                                <Grid2  key={j} size={{xs: 6, sm: 4, md: 2}}>
                                    <Box
                                    sx={{
                                        border: "1px dashed black",
                                        width: 200,
                                        height: 200,
                                        justifyContent: "center",
                                        alignItems: "center",
                                        display: "flex",
                                    }}
                                    >
                                            
                                        <Box key={j} sx={{ width: "100%", height: 200, position: "relative" }}>
                                            <BoxPreview side={type} />
                                            <img src={i.image} width={200} height={200} />
                                            <Box
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                right: 0,
                                                zIndex: 2,
                                            }}
                                            >
                                            <IconButton
                                                aria-label="close"
                                                onClick={() =>{
                                                        let im = {...images}
                                                        console.log(im)
                                                        im[type] = im[type].filter(ima=> ima.image !== i.image)
                                                        console.log(im)
                                                        setImages({...im})
                                                    }
                                                }
                                            >
                                                <FaWindowClose color="red" />
                                            </IconButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center", width: 200  }}>
                                        <CreatableSelect
                                            isMulti
                                            value={i.imageGroup?.map((id) => ({
                                            label:id,
                                            value: id,
                                            }))}
                                            onChange={(vals)=>{
                                                console.log(vals)
                                                let values =vals.map(v=>{return v.value})
                                                let im = {...images}
                                                let image =im[type].filter(ims=> ims.image == i.image)[0]
                                                image.imageGroup = values
                                                setImages({...im})
                                                let ig = [...imageGroups]
                                                values.map(v=>{
                                                    if(!ig.includes(v)) ig.push(v)
                                                })
                                                setImageGroups(ig)
                                            }}
                                            options={imageGroups.map(g=>{return {value: g, label: g}})}
                                        />
                                        <Button fullWidth onClick={() => overridePrintBox({box: i.box? i.box[0]: null, side: type, image: i.image})}>
                                            Set Design Box
                                        </Button>
                                    </Box>
                                </Grid2>
                            ))}
                        </Grid2>                
                    </Grid2>
                ))}
            </Grid2>
          </Box>
        </Box>
  
        <Modal
          open={imageToCrop}
          onClose={() => setImageToCrop(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Cropper
              src={imageToCrop}
              style={{ height: 400, width: 400 }}
              // Cropper.js options
              initialAspectRatio={1 / 1}
              aspectRatio={1 / 1}
              dragMode={"none"}
              guides={true}
              ref={cropperRef}
            />
            <Button onClick={onCrop} sx={{ mt: 2 }} variant="contained">
              Save Crop
            </Button>
          </Box>
        </Modal>
  
        <ImageUpload
          filesToUpload={filesToUpload}
          onUploadComplete={onUploadComplete}
        />
  
        {activeColorId && (
          <CropColorSwatchModal
            open={activeColorId}
            onClose={({ url }) => {
              //console.log(url, "URL");
              updateColor({ image: url, hexcode: null });
              setActiveColorId(null);
            }}
            imageType={imageType}
            cropBoxData={colorCropBoxData}
            color_id={activeColorId}
            images={images}
            setImages={setImages}
            imageToCrop={
              activeColorId &&
              blank?.images?.filter((i) => i.color == activeColorId)[0]?.image
            }
          />
        )}
      </>
    );
  };

const CropColorSwatchModal = ({
    open,
    onClose,
    color_id,
    cropBoxData,
    imageToCrop,
    images,
    setImages
    }) => {
    const [filesToUpload, setFilesToUpload] = useState([]);
    const cropperRef = useRef();
    const onCrop = async (img) => {
        //console.log("onCrop");
        const cropper = cropperRef.current?.cropper;
        if (!cropBoxData.current) {
        cropBoxData.current = cropper.getCropBoxData();
        //console.log(cropBoxData);
        }
        let base64 = cropper.getCroppedCanvas().toDataURL();
        let jimp = await Jimp.read(base64);
        jimp = await jimp.resize(64, 64);
        base64 = await jimp.getBase64Async(Jimp.MIME_JPEG);
        setFilesToUpload([{ base64, key: `colors/${color_id}.jpg` }]);
    };

    // useEffect(() => {
    //     if (images.length) {
    //     onClose({ url: images[0] });
    //     setImages([]);
    //     }
    // }, [images]);

    console.log(cropBoxData);

    useEffect(() => {
        setTimeout(() => {
        const cropper = cropperRef.current?.cropper;
        if (cropper && cropBoxData.current) {
            //console.log("settting crop box");
            cropper.setCropBoxData(cropBoxData.current);
        }
        }, 1000);
    }, []);

    const onUploadComplete = (urls) => {
        console.log("upload complete")
        let im = {...images}
        im[imageType].push({color: color_id, image: urls[0]})
        console.log(im)
        //setImages({...im});
    };

    return (
        <Modal
            open={true}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            <Box>
                <Box sx={{ background: "#ffffff22", position: "relative" }}>
                    <Cropper
                        src={imageToCrop}
                        style={{ height: 400, width: 400 }}
                        // Cropper.js options
                        initialAspectRatio={1 / 1}
                        aspectRatio={1 / 1}
                        dragMode={"none"}
                        guides={true}
                        ref={cropperRef}
                    />
                </Box>
                <Button onClick={onCrop} sx={{ mt: 2 }} variant="contained">
                Save Swatch
                </Button>
                <ImageUpload
                filesToUpload={filesToUpload}
                onUploadComplete={onUploadComplete}
                />
            </Box>
        </Modal>
    );
};