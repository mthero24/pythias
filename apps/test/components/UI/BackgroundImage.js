import React from 'react'

const BackgroundImage = ({children, src, style}) => {
    return (
        <div style={{...style, backgroundImage:`url('${src}')`, backgroundSize:'cover'}}>
            {children}
        </div>
    )
}

export default BackgroundImage
