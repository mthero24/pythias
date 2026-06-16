"use client";
import { useRef } from "react";
import Customizer from "./Customizer";
import BuyBox from "@/components/BuyBox";

// Product detail buy-area for customizable products: live designer above the normal buy box.
// The customizer's captured field values ride along with the cart line via getPersonalization().
export default function CustomizableBuyBox({ productId, title, images, variants, templateId }) {
    const custRef = useRef(null);
    const getPersonalization = () => {
        const r = custRef.current?.getResult();
        if (!r) return null;
        if (r.error) return { error: r.error };
        return { templateId, fields: r.fields };
    };
    return (
        <div>
            <Customizer ref={custRef} templateId={templateId} />
            <BuyBox productId={productId} title={title} images={images} variants={variants} getPersonalization={getPersonalization} />
        </div>
    );
}
