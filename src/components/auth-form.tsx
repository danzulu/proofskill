"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  googleAction,
  loginAction,
  signupAction,
  type AuthState,
} from "@/app/(auth)/actions";

export function AuthForm({
  mode,
  next,
}: {
  mode: "login" | "signup";
  next: string;
}) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  return (
    <Card className="w-full max-w-md border-white/10 bg-card/90 shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Continue an assessment or reopen a verified report."
            : "Your assessments and evidence stay attached to your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="name" name="name" autoComplete="name" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
            </div>
          )}
          {state?.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" disabled={pending}>
            {pending ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <form action={googleAction}>
          <input type="hidden" name="next" value={next} />
          <Button className="w-full" variant="outline">Continue with Google</Button>
        </form>

        <div className="flex justify-between text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href={mode === "login" ? "/signup" : "/login"}>
            {mode === "login" ? "Create account" : "Already registered?"}
          </Link>
          {mode === "login" && (
            <Link className="hover:text-foreground" href="/forgot-password">
              Forgot password?
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

