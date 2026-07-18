"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, updatePasswordAction, type AuthState } from "@/app/(auth)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthMessageForm({ mode }: { mode: "forgot" | "update" }) {
  const action = mode === "forgot" ? forgotPasswordAction : updatePasswordAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === "forgot" ? "Reset your password" : "Choose a new password"}</CardTitle>
        <CardDescription>
          {mode === "forgot"
            ? "We will send a secure recovery link."
            : "Your recovery session must still be active."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {mode === "forgot" ? (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input id="password" name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm password</Label>
                <Input id="confirm_password" name="confirm_password" type="password" minLength={8} required />
              </div>
            </>
          )}
          {state?.message && (
            <Alert variant={state.success ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <Button className="w-full" disabled={pending}>
            {pending ? "Working…" : mode === "forgot" ? "Send recovery link" : "Update password"}
          </Button>
          <Link className="block text-center text-sm text-muted-foreground hover:text-foreground" href="/login">
            Back to sign in
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}

