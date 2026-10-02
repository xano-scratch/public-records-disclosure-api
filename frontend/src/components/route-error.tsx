import { TriangleAlert } from "lucide-react";
import { Link, useRouteError } from "react-router";

import { Button } from "@/components/ui/button";

export function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : "An unexpected error occurred.";
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-5" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto max-w-md text-[0.8125rem] text-muted-foreground">{message}</p>
      </div>
      <Button asChild>
        <Link to="/">Back to overview</Link>
      </Button>
    </div>
  );
}
