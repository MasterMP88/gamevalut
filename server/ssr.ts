import { fetchViteEnv } from "nitro/vite/runtime";

export default function renderApp({ req }: { req: Request }) {
  return fetchViteEnv("ssr", req);
}
