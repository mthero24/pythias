import { createContext, useContext } from "react";

// Holds the store's /api/app/config payload (brand + theme + nav + flags) for the whole app tree.
export const StoreContext = createContext(null);
export const useStore = () => useContext(StoreContext);
export const useAccent = () => useContext(StoreContext)?.theme?.accent || "#f59e0b";
