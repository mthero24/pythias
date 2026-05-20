import { Design } from "@pythias/mongo";
import { DesignSearch as _DesignSearch } from "@pythias/backend/server";
export const DesignSearch = (opts) => _DesignSearch({ Design, ...opts });
