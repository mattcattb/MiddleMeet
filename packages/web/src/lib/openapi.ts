import createClient from "openapi-fetch";
import type { paths } from "../gen/openapi";
import { API_BASE_URL } from "./api";

export const openAPIClient = createClient<paths>({
  baseUrl: API_BASE_URL,
});
