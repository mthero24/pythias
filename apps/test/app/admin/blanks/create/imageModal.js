import {Modal, Box} from "@mui/material"
import { ColorImage } from "./ColorImage"
import { FaWindowClose } from "react-icons/fa";
const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "98%",
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: "98vh",
    overflow: "auto"
  };

export function ImageModal({openImage, setOpenImage, color, blank, activePrintAreas, overridePrintBox, images, boxSet, cropBoxData, setImages, colorCropBoxData, imageGroups, setImageGroups, box, printAreas }){
    return <Modal
    open={openImage}
    onClose={()=>{setOpenImage(false); document.getElementById("fab").click()}}
    aria-labelledby="modal-modal-title"
    aria-describedby="modal-modal-description"
  > 
    <Box sx={style}>
        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end"}}>
            <FaWindowClose color="red" onClick={()=>{setOpenImage(false); document.getElementById("fab").click()}} />
        </Box>
        <ColorImage
            style={blank}
            activePrintAreas={activePrintAreas?.sort(
            (a, b) => printAreas.indexOf(a) - printAreas.indexOf(b)
            )}
            overridePrintBox={({box, side, image}) =>
                overridePrintBox({ color_id: color._id, box, image, side })
            }
            boxSet={boxSet}
            color={color}
            cropBoxData={cropBoxData}
            images={images}
            setImages={setImages}
            box={box.current}
            colorCropBoxData={colorCropBoxData}
            imageGroups={imageGroups}
            setImageGroups={setImageGroups}
        />
    </Box>
  </Modal>
}