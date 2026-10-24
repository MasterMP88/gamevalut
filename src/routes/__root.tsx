import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SessionProvider } from "@/lib/game/store";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background safe-x">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="font-display mt-3 text-6xl text-foreground">Diese Tür ist verschlossen.</h1>
        <div className="mt-8">
          <Link
            to="/"
            className="tap inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Zurück zu NOCTURNE
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background safe-x">
      <div className="max-w-md text-center">
        <h1 className="font-display text-5xl text-foreground">Kurzer Stromausfall.</h1>
        <p className="mt-3 text-muted-foreground">Etwas hat geklemmt. Versuch es nochmal.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="tap min-h-12 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Nochmal
          </button>
          <a href="/" className="tap inline-flex min-h-12 items-center rounded-full border border-input px-6 text-sm">
            Zu NOCTURNE
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#141110" },
      { title: "NOCTURNE — Games for Two" },
      { name: "description", content: "NOCTURNE ist eine private, mobile Date-Night-Collection mit acht interaktiven Spielen für zwei Erwachsene — von leicht und lustig bis tief, frech und adaptiv. NIGHT//ECHO — Director ist das Flagship mit Session-Memory und generativer Regie. Kein Login; intime Freitexte bleiben nur in der laufenden Browser-Session." },
      { property: "og:title", content: "NOCTURNE — Games for Two" }
      ,{ property: "og:site_name", content: "NOCTURNE" },
      { property: "og:description", content: "NOCTURNE ist eine private, mobile Date-Night-Collection mit acht interaktiven Spielen für zwei Erwachsene — von leicht und lustig bis tief, frech und adaptiv. NIGHT//ECHO — Director ist das Flagship mit Session-Memory und generativer Regie. Kein Login; intime Freitexte bleiben nur in der laufenden Browser-Session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </QueryClientProvider>
  );
}