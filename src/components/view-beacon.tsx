"use client"

import { useEffect } from "react"

export function ViewBeacon({ jobId, providerId }: { jobId: string; providerId: string }) {
  useEffect(() => {
    void fetch(`/api/jobs/${jobId}/view`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId }),
    })
  }, [jobId, providerId])
  return null
}
