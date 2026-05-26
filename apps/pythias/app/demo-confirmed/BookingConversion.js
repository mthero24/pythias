"use client";
import { useEffect } from "react";

export default function BookingConversion() {
    useEffect(() => {
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
            window.gtag("event", "conversion_event_book_appointment_1");
        }
    }, []);
    return null;
}
