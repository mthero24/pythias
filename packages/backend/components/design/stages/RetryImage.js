"use client";
import { useEffect, useRef, useState } from "react";

export const RetryImage = ({ src, maxRetries = 2, retryDelay = 500, onError, ...rest }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const attemptRef = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        attemptRef.current = 0;
        setCurrentSrc(src);
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [src]);

    const handleError = (e) => {
        if (!src) { if (onError) onError(e); return; }
        if (attemptRef.current < maxRetries) {
            attemptRef.current += 1;
            const sep = src.includes("?") ? "&" : "?";
            const next = `${src}${sep}__retry=${attemptRef.current}`;
            timerRef.current = setTimeout(() => setCurrentSrc(next), retryDelay);
        } else if (onError) {
            onError(e);
        }
    };

    return <img {...rest} src={currentSrc} onError={handleError} />;
};
