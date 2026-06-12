"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BrainCircuit, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    async (prevState: { error: string | null }, formData: FormData) => {
      const result = await login(formData);
      if (result?.error) {
        return { error: result.error };
      }
      return { error: null };
    },
    { error: null }
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl border border-primary/20 mb-4">
            <BrainCircuit className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-heading text-center tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            TalentVerse AI
          </h1>
          <p className="text-muted-foreground mt-2 text-center">
            AI-Powered Recruitment Intelligence
          </p>
        </div>

        <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-center">Manager Portal</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage AI-processed CVs and analytics.
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-4">
              {state.error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 text-center">
                  {state.error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="manager@talentverse.ai"
                  required
                  className="bg-background/50 border-border/50 focus-visible:ring-primary"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-background/50 border-border/50 focus-visible:ring-primary"
                  disabled={isPending}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} TalentVerse. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
