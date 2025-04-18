window.fetch = jest.fn().mockReturnValue(
  new Promise((resolve) => {
    resolve({
      json: () => ({}),
    })
  }),
)

import { type RequestOptions, buildEncodedQueryString, request } from "../../src/utils"

//  @ts-ignore
const mockFetch = <jest.Mock>fetch
describe("request", () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it("should add url encoded content type with requestType=form", async () => {
    const opts: RequestOptions = {
      url: "http://some.url",
      requestType: "form",
      method: "POST",
    }

    await request(opts)
    expect(mockFetch).toBeCalledWith(opts.url, {
      method: opts.method,
      body: null,
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    })
  })

  it("should encode body with requestType=form", async () => {
    const opts: RequestOptions = {
      url: "http://some.url",
      requestType: "form",
      method: "POST",
      body: {
        a: 1,
        b: "hello world",
      },
    }

    await request(opts)
    expect(mockFetch).toBeCalledWith(opts.url, {
      method: opts.method,
      body: buildEncodedQueryString(opts.body, false),
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    })
  })

  it("should add json content type with requestType=json", async () => {
    const opts: RequestOptions = {
      url: "http://some.url",
      requestType: "json",
      method: "POST",
    }

    await request(opts)
    expect(mockFetch).toBeCalledWith(opts.url, {
      method: opts.method,
      body: null,
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    })
  })

  it("should stringify body with requestType=json", async () => {
    const opts: RequestOptions = {
      url: "http://some.url",
      requestType: "json",
      method: "POST",
      body: {
        a: "1",
        b: "2",
      },
    }

    await request(opts)
    expect(mockFetch).toBeCalledWith(opts.url, {
      method: opts.method,
      body: JSON.stringify(opts.body),
      headers: { "Content-Type": "application/json;charset=UTF-8" },
    })
  })

  it("should allow overriding headers", async () => {
    const opts: RequestOptions = {
      url: "http://some.url",
      requestType: "json",
      method: "POST",
      headers: {
        "X-Test": "test",
      },
    }

    await request(opts)
    expect(mockFetch).toBeCalledWith(opts.url, {
      method: opts.method,
      body: null,
      headers: { "Content-Type": "application/json;charset=UTF-8", "X-Test": "test" },
    })
  })
})
