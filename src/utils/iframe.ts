import { AuthenticationError, OIDCClientError } from "../errors"
import type { IFrameOptions } from "../interfaces"

/**
 * Default HTML attributes applied to every hidden iframe created by
 * {@link createHiddenFrame} and used internally by {@link runIframe}.
 *
 * These attributes control accessibility and identification of the iframe
 * used during silent authentication and session-related operations.
 *
 * ## Customization
 * This object is **intentionally mutable** and acts as a global extension point.
 * Applications may modify or extend the attributes to adjust how the iframe is
 * rendered—for example, to add monitoring hooks, test selectors, or custom
 * accessibility attributes.
 *
 * Modifications must be applied **before** any iframe-related `OIDCClient`
 * methods are called (such as {@link OIDCClient.silentLogin}), because each
 * iframe is created using a snapshot of `DefaultIframeAttributes` at creation time.
 *
 * ### Example: Adding a custom attribute
 *
 * ```ts
 * import { DefaultIframeAttributes, OIDCClient } from "@plusauth/oidc-client-js";
 *
 * // Add a custom data attribute to all future hidden iframes
 * DefaultIframeAttributes["data-myapp"] = "example";
 *
 * const oidc = new OIDCClient({ ... });
 * await oidc.silentLogin();
 *
 * // The silent login iframe now includes: <iframe data-myapp="example" ...>
 * ```
 *
 * Typical use cases include:
 *  - Adding `data-*` attributes for debugging or testing
 *  - Adding custom accessibility metadata
 *  - Integrating with CSP / monitoring tools requiring tagged iframe elements
 *
 * @see createHiddenFrame
 * @see runIframe
 */
export const DefaultIframeAttributes = {
  title: "__pa_helper__hidden",
  "aria-hidden": "true",
} as Record<string, string>

export function createHiddenFrame() {
  const iframe = window.document.createElement("iframe")
  iframe.style.width = "0"
  iframe.style.height = "0"
  iframe.style.position = "absolute"
  iframe.style.visibility = "hidden"
  iframe.style.display = "none"

  for (const [key, value] of Object.entries(DefaultIframeAttributes)) {
    iframe.setAttribute(key, value)
  }

  return iframe
}

export function runIframe(url: string, options: IFrameOptions) {
  return new Promise<any>((resolve, reject) => {
    let onLoadTimeoutId: any = null
    const timeoutMs = (options.timeout || 10) * 1000
    const iframe = createHiddenFrame()

    const timeoutSetTimeoutId = setTimeout(() => {
      reject(new OIDCClientError("Timed out"))
      removeIframe()
    }, timeoutMs)

    const iframeEventHandler = (e: MessageEvent) => {
      if (e.origin !== options.eventOrigin) return
      if (!e.data || e.data.type !== "authorization_response") return
      const eventSource = e.source
      if (eventSource) {
        ;(<any>eventSource).close()
      }

      const resp = e.data.response || e.data
      resp.error
        ? reject(
            new AuthenticationError(resp.error, resp.error_description, resp.state, resp.error_uri),
          )
        : resolve(e.data)
      clearTimeout(timeoutSetTimeoutId)
      removeIframe()
    }

    const removeIframe = () => {
      if (onLoadTimeoutId != null) {
        clearTimeout(onLoadTimeoutId)
      }
      if (window.document.body.contains(iframe)) {
        window.document.body.removeChild(iframe)
      }
      window.removeEventListener("message", iframeEventHandler, false)
    }

    const onLoadTimeout = () =>
      setTimeout(() => {
        reject(new OIDCClientError("Could not complete silent authentication", url))
        removeIframe()
      }, timeoutMs)

    window.addEventListener("message", iframeEventHandler, false)
    window.document.body.appendChild(iframe)
    iframe.setAttribute("src", url)

    /**
     * In case of wrong client id, wrong redirect_uri, in short when redirect did not happen
     * we assume flow failed.
     */
    iframe.onload = () => {
      onLoadTimeoutId = onLoadTimeout()
    }
  })
}
