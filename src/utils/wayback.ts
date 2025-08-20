// Utility functions for Wayback Machine API integration

export interface WaybackResponse {
  archived_snapshots: {
    closest?: {
      url: string
      timestamp: string
      status: string
    }
  }
}

export interface WaybackSnapshot {
  url: string
  timestamp: string
  status: string
  originalUrl: string
}

/**
 * Fetch the latest snapshot for a given URL from Wayback Machine
 */
export async function getLatestSnapshot(
  url: string
): Promise<WaybackSnapshot | null> {
  try {
    const response = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: WaybackResponse = await response.json()

    if (data.archived_snapshots.closest?.url) {
      return {
        url: data.archived_snapshots.closest.url,
        timestamp: data.archived_snapshots.closest.timestamp,
        status: data.archived_snapshots.closest.status,
        originalUrl: url
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching Wayback snapshot:", error)
    return null
  }
}

/**
 * Format timestamp from Wayback Machine format to readable date
 */
export function formatWaybackTimestamp(timestamp: string): string {
  if (timestamp.length !== 14) return timestamp

  const year = timestamp.substring(0, 4)
  const month = timestamp.substring(4, 6)
  const day = timestamp.substring(6, 8)
  const hour = timestamp.substring(8, 10)
  const minute = timestamp.substring(10, 12)

  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`)

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    // Try adding https:// prefix if no protocol is specified
    try {
      new URL(`https://${string}`)
      return true
    } catch (_) {
      return false
    }
  }
}

/**
 * Normalize URL by adding https:// if no protocol is specified
 */
export function normalizeUrl(url: string): string {
  try {
    new URL(url)
    return url
  } catch (_) {
    return `https://${url}`
  }
}
