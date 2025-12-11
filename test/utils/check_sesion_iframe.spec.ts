import { describe, expect, it } from "vitest"
import { createSessionCheckerFrame } from "../../src/utils"

describe("checkSessionIframe", () => {
  it("should have start and stop methods", () => {
    // @ts-expect-error
    const checker = createSessionCheckerFrame({ url: "http://test.url" })

    expect(checker).toHaveProperty("start", expect.any(Function))
    expect(checker).toHaveProperty("stop", expect.any(Function))
  })
})
