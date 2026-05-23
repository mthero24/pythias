import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  credentials: {
    accessKeyId:     process.env.NEXT_PUBLIC_WASABI_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_WASABI_SECRET,
  },
  region:   "us-west-1",
  endpoint: "https://s3.us-west-1.wasabisys.com/",
});

const BUCKET = "images1.pythiastechnologies.com";

function keyFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  try {
    const u = new URL(url);
    if (u.hostname === "images1.pythiastechnologies.com") return u.pathname.slice(1);
    if (u.hostname === "images2.pythiastechnologies.com") return u.pathname.replace(/^\/origin\//, "");
  } catch {}
  return null;
}

/** Delete one or many S3 URLs.  Silently skips non-Wasabi URLs and dedupes. */
export async function deleteFromS3(urls) {
  const keys = [...new Set(
    (Array.isArray(urls) ? urls : [urls]).map(keyFromUrl).filter(Boolean)
  )];
  if (!keys.length) return;
  await Promise.allSettled(
    keys.map(Key => s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key })))
  );
}

/** Collect every image URL stored on a Design document. */
export function designImageUrls(design) {
  const urls = [];
  function walk(val) {
    if (!val) return;
    if (typeof val === "string") { urls.push(val); return; }
    if (typeof val === "object") Object.values(val).forEach(walk);
  }
  walk(design.images);
  walk(design.sublimationImages);
  walk(design.embroideryFiles);
  walk(design.threadImages);
  return urls;
}

/** Collect every image URL stored on a Product document. */
export function productImageUrls(product) {
  const urls = [];
  for (const pi of (product.productImages || [])) if (pi.image) urls.push(pi.image);
  function walkImgObj(obj) {
    if (!obj || typeof obj !== "object") return;
    for (const v of Object.values(obj)) {
      if (typeof v === "string") urls.push(v);
      else if (Array.isArray(v)) v.forEach(item => {
        if (typeof item === "string") urls.push(item);
        else if (item?.image) urls.push(item.image);
      });
      else if (v?.image) urls.push(v.image);
    }
  }
  walkImgObj(product.variantImages);
  walkImgObj(product.variantSecondaryImages);
  return urls;
}

/** Collect every image URL stored on a Blank document. */
export function blankImageUrls(blank) {
  const urls = [];
  for (const img of (blank.images || [])) if (img.image) urls.push(img.image);
  if (blank.sizeGuide?.image) urls.push(blank.sizeGuide.image);
  for (const img of (blank.sizeGuide?.images || [])) if (typeof img === "string") urls.push(img);
  for (const v of (blank.videos || [])) if (typeof v === "string") urls.push(v);
  return urls;
}
