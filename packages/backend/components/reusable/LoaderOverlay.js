import { Backdrop, CircularProgress, Typography } from '@mui/material'
import React from 'react'
import {useState, useEffect} from 'react'
const LoaderOverlay = () => {
  const [flash, setFlash] = useState(false)
  useEffect(() => {
    const iner = async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      setFlash(!flash)
    }
    iner()
  }, [flash])
  return (
    <Backdrop
    sx={{ color: "#fff", zIndex: 999 }}
    open={true}
  >
      <CircularProgress color="#e2e2e2" size={100} />
      <Typography variant="h6" sx={{ display: flash? "block": "none", color: "#e2e2e2", marginTop: "20px", fontSize: "2.6rem", fontWeight: "bold" }}>
        Loading...</Typography>
  </Backdrop>
  )
}

export default LoaderOverlay