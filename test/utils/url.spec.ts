import { describe, expect, it } from "vitest"

import { buildEncodedQueryString, parseQueryUrl } from "../../src/utils"

describe("url util", () => {
  describe("build encoded query string", () => {
    it("should encode object", () => {
      const obj = {
        a: 1,
        b: "str",
      }
      expect(buildEncodedQueryString(obj)).toEqual("?a=1&b=str")
    })

    it("should encode object (2)", () => {
      expect(buildEncodedQueryString()).toEqual("")
    })

    it("should ignore undefined values", () => {
      const obj = {
        a: 1,
        b: undefined,
      }

      expect(buildEncodedQueryString(obj)).toEqual("?a=1")
    })

    it("should not include query mark if not appendable", () => {
      const obj = {
        a: 1,
        b: "str",
      }
      expect(buildEncodedQueryString(obj, false)).toEqual("a=1&b=str")
    })

    it("should only include own properties", () => {
      const obj = {
        a: 1,
        b: "str",
      }
      // @ts-expect-error
      obj.__proto__.c = "something"
      expect(buildEncodedQueryString(obj)).toEqual("?a=1&b=str")
    })

    it("should encode params", () => {
      const obj = {
        a: "hello world",
      }
      expect(buildEncodedQueryString(obj)).toEqual("?a=hello%20world")
    })

    it("should allow nested objects", () => {
      const obj = {
        a: {
          b: "1",
          c: {
            d: 2,
          },
        },
      }
      expect(buildEncodedQueryString(obj)).toEqual(
        "?a=%7B%22b%22%3A%221%22%2C%22c%22%3A%7B%22d%22%3A2%7D%7D",
      )
    })
  })

  describe("parse url query", () => {
    it("should parse starting with question mark", () => {
      const url = "?a=1&b=2&c=test"
      expect(parseQueryUrl(url)).toMatchObject({
        a: "1",
        b: "2",
        c: "test",
      })
    })

    it("should parse fragment query ", () => {
      const url = "#a=1&b=2&c=test"
      expect(parseQueryUrl(url)).toMatchObject({
        a: "1",
        b: "2",
        c: "test",
      })
    })

    it("should parse url with empty params ", () => {
      const url = "?a=&b=2&c=test"
      expect(parseQueryUrl(url)).toMatchObject({
        a: "",
        b: "2",
        c: "test",
      })
    })

    it("should decode encoded params", () => {
      const url = "?a=hello%20world"
      expect(parseQueryUrl(url)).toMatchObject({
        a: "hello world",
      })
    })
  })
})
