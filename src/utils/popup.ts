import { InteractionCancelled, OIDCClientError } from "../errors"
import type { PopupOptions } from "../interfaces"

const openPopup = (url: string, width = 400, height = 600) => {
  const left = window.screenX + (window.innerWidth - width) / 2
  const top = window.screenY + (window.innerHeight - height) / 2

  return window.open(
    url,
    "oidc-login-popup",
    `left=${left},top=${top},width=${width},height=${height},resizable,scrollbars=yes,status=1`,
  )
}

export function runPopup(url: string, options: PopupOptions) {
  let popup = options.popup

  if (popup) {
    popup.location.href = url
  } else {
    popup = openPopup(url)
  }

  if (!popup) {
    /* istanbul ignore next */
    throw new Error("Could not open popup")
  }

  let timeoutId: any
  let closeId: any

  return new Promise<{ response: any; state: string }>((resolve, reject) => {
    function clearHandlers() {
      clearInterval(closeId)
      clearTimeout(timeoutId)
      window.removeEventListener("message", messageListener)
    }

    const timeoutMs = (options.timeout || 60) * 1000
    timeoutId = setTimeout(() => {
      clearHandlers()
      reject(new OIDCClientError("Timed out"))
    }, timeoutMs)

    closeId = setInterval(() => {
      if (popup!.closed) {
        clearHandlers()
        reject(new InteractionCancelled("user closed popup"))
      }
    }, timeoutMs)

    window.addEventListener("message", messageListener)

    function messageListener(e: MessageEvent) {
      if (!e.data || e.data.type !== "authorization_response") return
      clearHandlers()
      popup!.close()
      const data = e.data.response || e.data
      data.error ? reject(new OIDCClientError(data.error, data.error_description)) : resolve(e.data)
    }
  })
}
