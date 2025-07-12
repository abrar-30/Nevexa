"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-api"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      if (user) {
        router.replace("/dashboard")
      } else {
        router.replace("/auth/login")
      }
    }
    checkAuth()
  }, [router])

  return null
}
