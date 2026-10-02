import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import "./index.css";

import { AppShell } from "@/components/app-shell";
import { RouteError } from "@/components/route-error";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/lib/session";
import { initMode } from "@/lib/theme";
import AgentConsole from "@/routes/agent-console";
import Audit from "@/routes/audit";
import Overview from "@/routes/overview";
import Policy from "@/routes/policy";
import RecordView from "@/routes/record-view";
import RequestDetail from "@/routes/request-detail";
import Requests from "@/routes/requests";
import SignIn from "@/routes/sign-in";
import SignUp from "@/routes/sign-up";

initMode();

const router = createBrowserRouter([
  { path: "/sign-in", element: <SignIn />, errorElement: <RouteError /> },
  { path: "/sign-up", element: <SignUp />, errorElement: <RouteError /> },
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Overview /> },
      { path: "requests", element: <Requests /> },
      { path: "requests/:requestId", element: <RequestDetail /> },
      { path: "records/:recordId", element: <RecordView /> },
      { path: "agent", element: <AgentConsole /> },
      { path: "audit", element: <Audit /> },
      { path: "policy", element: <Policy /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SessionProvider>
      <TooltipProvider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </TooltipProvider>
    </SessionProvider>
  </StrictMode>,
);
