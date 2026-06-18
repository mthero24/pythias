import Hero from "./Hero";
import RichText from "./RichText";
import FeaturedProducts from "./FeaturedProducts";
import ImageCollage from "./ImageCollage";

// Section type → pure component. The DB stores only { type, settings }; this maps a
// type key to its renderer. The drag-to-reorder editor and the AI assistant both
// operate on this same set. See manifest.js for the editor's field schema.
export const SECTION_REGISTRY = {
    hero: Hero,
    richText: RichText,
    featuredProducts: FeaturedProducts,
    imageCollage: ImageCollage,
};

export const SECTION_TYPES = Object.keys(SECTION_REGISTRY);
