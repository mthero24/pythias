import { Backdrop, CircularProgress } from '@mui/material'
import React from 'react'

const LoaderOverlay = () => {
  return (
    <Backdrop
    sx={{ color: "#fff", zIndex: 999 }}
    open={true}
  >
    <CircularProgress color="inherit" />
  </Backdrop>
  )
}

export default LoaderOverlay