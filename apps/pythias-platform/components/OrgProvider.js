"use client";
import { createContext, useContext } from "react";
import { SessionProvider } from "next-auth/react";

const OrgContext = createContext(null);

export function useOrg() {
    return useContext(OrgContext);
}

export default function OrgProvider({ org, user, children }) {
    return (
        <SessionProvider>
            <OrgContext.Provider value={{ org, user }}>
                {children}
            </OrgContext.Provider>
        </SessionProvider>
    );
}
