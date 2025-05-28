import { Button } from "@mui/material";
import { useRef } from "react";

const LoaderButton = ({children, onClick, ...props}) => {
    const isDisabled = useRef(false);

    let handleClick = () => {
        if(isDisabled.current) return;
        isDisabled.current = true
        if(onClick){
            onClick();
        }
    }

    return (
        <Button onClick={handleClick} {...props}>{children}</Button>
    )
}

export default LoaderButton;