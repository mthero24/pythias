import { Backdrop, CircularProgress } from '@mui/material'
import React from 'react'

const LoaderOverlay = (open) => {
  return (
    <Backdrop
    sx={{ color: "#fff", zIndex: 999 }}
    open={open}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
  )
}

export default LoaderOverlay