import { LoginMain } from "@pythias/backend";

export default async function Login() {
    return (
        <LoginMain
            type="login"
            name="Pythias Technologies"
            tagline="Internal Administration"
            redirectTo="/admin"
            notFoundRedirect="https://platform.pythiastechnologies.com"
        />
    );
}
