import { AsyncLocalStorage } from "async_hooks";

const storage = new AsyncLocalStorage();

export function runWithOrg(org, fn) {
    return storage.run(org, fn);
}

export function getOrg() {
    return storage.getStore();
}

export function getOrgId() {
    return storage.getStore()?._id;
}
