"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { loginUser } from '@/lib/auth-api';

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log('Attempting login...')
      const result = await loginUser(email, password)
      console.log('Login result:', result)
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Nevexa!",
      })
      
      console.log('Redirecting to dashboard...')
      
      // Try router.push first, fallback to window.location if needed
      try {
        router.push("/dashboard")
        // Fallback redirect after a short delay
        setTimeout(() => {
          if (window.location.pathname !== "/dashboard") {
            console.log('Fallback redirect to dashboard...')
            window.location.href = "/dashboard"
          }
        }, 1000)
      } catch (redirectError) {
        console.error('Router redirect failed, using window.location:', redirectError)
        window.location.href = "/dashboard"
      }
    } catch (err: any) {
      console.error('Login error:', err)
      toast({
        title: "Login Failed",
        description: err.message || "Invalid credentials",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md space-y-4">
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <img 
                src="/placeholder-logo.png" 
                alt="Nevexa Logo" 
                className="h-12 w-auto"
              />
            </div>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-sm text-center text-gray-600">
                {"Don't have an account? "}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
