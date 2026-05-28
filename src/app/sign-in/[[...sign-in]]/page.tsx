"use client"

import { useState, Suspense, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"

function SignInForm() {
  const { signIn, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    localStorage.removeItem("kranely_session")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const success = await signIn(email, password)
    if (success) {
      window.location.href = "/dashboard"
    } else {
      setError("Email o password non corretti")
    }
  }

  return (
    <div className="w-full max-w-md px-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-kranely-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-kranely-app-bg font-bold text-2xl">K</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Bentornato</h1>
        <p className="text-white/60 mt-2">Accedi alla tua dashboard Kranely</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 focus:border-kranely-accent/50"
            placeholder="admin@kranely.app"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-kranely-accent/50 focus:border-kranely-accent/50"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-end">
          <a href="/forgot-password" className="text-xs text-kranely-accent hover:underline">
            Password dimenticata?
          </a>
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-kranely-accent text-kranely-app-bg hover:bg-kranely-accent/90 font-semibold"
        >
          {isLoading ? "Accesso in corso..." : "Accedi"}
        </Button>
      </form>



      <p className="text-center text-sm text-white/60 mt-6">
        Non hai un account?{" "}
        <a href="/sign-up" className="text-kranely-accent hover:underline">
          Registrati ora
        </a>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-kranely-app-bg">
      <Suspense fallback={
        <div className="text-center">
          <div className="w-8 h-8 rounded-lg bg-kranely-accent flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-kranely-app-bg font-bold text-lg">K</span>
          </div>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </div>
  )
}
