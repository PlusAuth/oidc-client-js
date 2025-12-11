import { fromByteArray } from "base64-js"

export function isValidIssuer(issuer: string) {
  try {
    const url = new URL(issuer)
    if (!["http:", "https:"].includes(url.protocol)) {
      return false
    }
    if (url.search !== "" || url.hash !== "") {
      return false
    }
    return true
  } catch {
    return false
  }
}
export function buildEncodedQueryString(obj?: Record<string, any>, appendable = true) {
  if (!obj) return ""
  const ret: string[] = []
  for (const d in obj) {
    if (obj.hasOwnProperty(d) && obj[d]) {
      ret.push(
        `${encodeURIComponent(d)}=${encodeURIComponent(
          typeof obj[d] === "object" ? JSON.stringify(obj[d]) : obj[d]!,
        )}`,
      )
    }
  }
  return `${appendable ? "?" : ""}${ret.join("&")}`
}

export function parseQueryUrl(value: string) {
  const result: Record<string, string> = {}
  value = value.trim().replace(/^(\?|#|&)/, "")
  const params = value.split("&")
  for (let i = 0; i < params.length; i += 1) {
    const paramAndValue = params[i]
    const parts = paramAndValue.split("=")
    const key = decodeURIComponent(parts.shift()!)
    const value = parts.length > 0 ? parts.join("=") : ""
    result[key] = decodeURIComponent(value)
  }
  return result
}

export function urlSafe(data: Uint8Array | string): string {
  const encoded = typeof data === "string" ? data : fromByteArray(new Uint8Array(data))
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}
