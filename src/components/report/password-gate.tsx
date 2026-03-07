"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Loader2 } from "lucide-react";
import { verifyReportPassword } from "@/actions/report";

interface PasswordGateProps {
  shareId: string;
  children: React.ReactNode;
}

export function PasswordGate({ shareId, children }: PasswordGateProps) {
  const [verified, setVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    startTransition(async () => {
      const valid = await verifyReportPassword(shareId, password);
      if (valid) {
        setVerified(true);
      } else {
        setError(true);
      }
    });
  }

  if (verified) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-semibold">Password Required</h1>
          <p className="text-sm text-muted-foreground">
            This report is password protected.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          {error && (
            <p className="text-sm text-destructive">
              Incorrect password. Please try again.
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "View Report"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
