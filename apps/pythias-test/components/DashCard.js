import { Box, Typography } from '@mui/material'
import React from 'react'

const DashCard = ({children, title, hover=true, background, sx}) => {

    let hoverEffects = {
        '&:hover':{
            boxShadow:1,
        }
    }

    if(!hover){
        hoverEffects = {}
    }

    return (
        <Box sx={{
            p:2,
            borderRadius:1,
            minWidth: '100%',
            height:'100%',
            cursor: 'pointer',
            boxShadow:1,
            display:"flex",
            flexDirection:'column',
            transition:'all 0.3s',
            marginTop: "0.2%",
            ...hoverEffects,
            ...sx
        }}>
            <Typography variant="body2" fontWeight={600} sx={{fontSize: 14, mb: '4px'}}>
                {title}
            </Typography>
            {children}
        </Box>
    )
}

export default DashCard
