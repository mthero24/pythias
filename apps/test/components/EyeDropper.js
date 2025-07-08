import { faEyeDropper } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Box } from '@mui/material'
import React, { useState, useCallback } from 'react'
import useEyeDropper from 'use-eye-dropper'

const EyeDropper = ({onColorChange}) => {
  const { open, close, isSupported } = useEyeDropper()
  const [color, setColor] = useState('#fff')
  const [error, setError] = useState()
  // useEyeDropper will reject/cleanup the open() promise on unmount,
  // so setState never fires when the component is unmounted.
  const pickColor = useCallback(() => {
    // Using async/await (can be used as a promise as-well)
    const openPicker = async () => {
      try {
        const color = await open()
        //console.log(onColorChange,'huh')
        if(onColorChange){
            onColorChange(color.sRGBHex)
        }
      } catch (e) {
        console.log(e)
        // Ensures component is still mounted
        // before calling setState
        if (!e.canceled) setError(e)
      }
    }
    openPicker()
  }, [open])
  return (
    <>
      {isSupported() ?
        <Box onClick={pickColor} sx={{px:1, cursor:'pointer', zIndex:2}}>
            <FontAwesomeIcon icon={faEyeDropper} />
        </Box>
        : <span>EyeDropper API not supported in this browser</span>
      }
      {/* {!!error && <div>{error.message}</div>} */}
    </>
  )
}

export default EyeDropper;