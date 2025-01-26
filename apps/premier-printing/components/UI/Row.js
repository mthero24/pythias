import { Box } from '@mui/material'
import React from 'react'

const Row = ({children, sx, style}) => {
    return (
        <Box style={style} sx={{display:'flex', alignItems:'center', ...sx}}>
            {children}
        </Box>
    )
}

export default Row
