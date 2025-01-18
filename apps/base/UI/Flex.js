import { Box } from '@mui/material'
import React from 'react'

const Flex = ({style, flexDirection = 'row', alignItems, justifyContent, spacing, children}) => {
    let styles = {
        ...style,
        display: 'flex',
        flexDirection: flexDirection,
        alignItems: alignItems,
        justifyContent: justifyContent,
        spacing: spacing
    }

    return (
        <Box style={styles}>
            {children}
        </Box>  
    )
}

export default Flex
