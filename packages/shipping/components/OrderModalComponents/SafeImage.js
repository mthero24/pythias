import { useState } from "react";
import { Box } from "@mui/material";
import Image from "next/image";
import ImageNotSupportedIcon from "@mui/icons-material/ImageNotSupported";

export function SafeImage({ src, alt, width, height, style }) {
    const [error, setError] = useState(false);

    if (!src || error) {
        return (
            <Box sx={{
                width, height,
                display: "flex", alignItems: "center", justifyContent: "center",
                bgcolor: "action.hover", borderRadius: 1,
                flexShrink: 0,
            }}>
                <ImageNotSupportedIcon sx={{ color: "text.disabled", fontSize: Math.min(width, height) * 0.5 }} />
            </Box>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            style={style}
            onError={() => setError(true)}
        />
    );
}
