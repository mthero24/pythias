import { BrandsMain } from "@pythias/backend";
export const dynamic = "force-dynamic";
export const metadata = { title: "Brands" };
export default function BrandsPage() {
    return <BrandsMain uploadPath="/api/admin/upload" />;
}
