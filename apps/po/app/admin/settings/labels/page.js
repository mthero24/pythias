import { LabelSettingsMain } from "@pythias/backend";
import { PO_LABEL_TEMPLATE_DEFAULT } from "@pythias/backend/server";

export default function LabelSettingsPage() {
    return <LabelSettingsMain defaultTemplate={PO_LABEL_TEMPLATE_DEFAULT} />;
}
