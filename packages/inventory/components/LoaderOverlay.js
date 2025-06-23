import { Backdrop, CircularProgress } from '@mui/material'
import React from 'react'

export function LoaderOverlay({loading}){
  console.log(loading)
  return (
    <Backdrop
      sx={{ color: "#fff", zIndex: 999 }}
      open={loading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  )
}

export default LoaderOverlay