"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-4 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--violet)]/20 blur-[120px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <motion.img 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            src="/logo.png" alt="TalentVerse AI Logo" className="h-[96px] w-auto object-contain mb-5 drop-shadow-[0_8px_32px_rgba(147,83,245,0.4)]" 
          />
          <h1 className="text-[32px] font-extrabold font-heading tracking-[0.1em] uppercase text-white drop-shadow-sm">
            TALENT VERSE AI
          </h1>
          <p className="text-slate-400 mt-2.5 text-[11px] font-bold tracking-[0.2em] uppercase">
            AI Powered Recruitment Services
          </p>
        </div>

        <Card className="bg-card/40 backdrop-blur-2xl border-white/5 shadow-[0_8px_40px_rgba(0,0,0,0.4)] relative overflow-hidden rounded-[20px]">
          {/* Subtle top border gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--violet)] via-pink-500 to-[var(--violet)] opacity-70"></div>
          
          <CardHeader className="pb-6 pt-8">
            <CardTitle className="text-xl text-center font-heading text-white tracking-wide">Manager Portal</CardTitle>
            <CardDescription className="text-center text-slate-400 mt-1.5">
              Secure access to AI analytics and candidates
            </CardDescription>
          </CardHeader>
          <form action={formAction}>
            <CardContent className="space-y-5 px-8">
              {state.error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 text-red-400 text-[13px] p-3 rounded-lg border border-red-500/20 text-center font-medium">
                  {state.error}
                </motion.div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Work Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="manager@talentverse.ai"
                  required
                  className="bg-black/20 border-white/10 h-12 rounded-xl text-[14px] text-white placeholder:text-slate-500 focus-visible:ring-[var(--violet)] focus-visible:border-[var(--violet)] transition-all"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Password</Label>
                  <a href="#" className="text-xs text-pink-400 hover:text-pink-300 transition-colors font-semibold tracking-wide">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="bg-black/20 border-white/10 h-12 rounded-xl text-[14px] text-white placeholder:text-slate-500 focus-visible:ring-[var(--violet)] focus-visible:border-[var(--violet)] transition-all pr-10"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-8 pt-4 px-8">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[var(--violet)] to-[#EC4899] hover:opacity-90 text-white font-bold text-[14px] shadow-[0_4px_14px_var(--violet-glow)] transition-all hover:shadow-[0_6px_20px_var(--violet-glow)] hover:-translate-y-0.5" 
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Access Portal"
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
