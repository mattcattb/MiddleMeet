import createClient from "openapi-fetch";
import type { paths } from "../gen/openapi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const openAPIClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});
