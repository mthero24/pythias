import { LoginMain } from "@pythias/backend";

export default async function Login() {
    return (
        <LoginMain
            type="login"
            name="Pythias Fulfillment Cloud"
            tagline="Sell anywhere. Fulfill everywhere."
            logo="/fullfilment_cloud_transparant.png"
            redirectTo="https://platform.pythiastechnologies.com"
        />
    );
}
