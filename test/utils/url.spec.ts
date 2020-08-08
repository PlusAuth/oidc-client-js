import {buildEncodedQueryString, parseQueryUrl} from "../../src/utils";

describe('url util', function () {
  describe('build encoded query string', function () {

    it('should encode object', function () {
      const obj = {
        a: 1,
        b: "str"
      }
      expect(buildEncodedQueryString(obj)).toEqual("?a=1&b=str")
    });
    
    it('should encode object (2)', function () {
      expect(buildEncodedQueryString()).toEqual("")
    });

    it('should ignore undefined values', function () {
      const obj = {
        a: 1,
        b: undefined
      }

      expect(buildEncodedQueryString(obj)).toEqual("?a=1")
    });

    it('should not include query mark if not appendable', function () {
      const obj = {
        a: 1,
        b: "str"
      }
      expect(buildEncodedQueryString(obj, false)).toEqual("a=1&b=str")
    });

    it('should only include own properties', function () {
      const obj = {
        a: 1,
        b: "str"
      }
      // @ts-ignore
      obj.__proto__.c = 'something'
      expect(buildEncodedQueryString(obj)).toEqual("?a=1&b=str")
    });

    it('should encode params', function () {
      const obj = {
        a: 'hello world'
      }
      expect(buildEncodedQueryString(obj)).toEqual('?a=hello%20world')
    });

  })

  describe('parse url query', function () {

    it('should parse starting with question mark', function () {
      const url = '?a=1&b=2&c=test';
      expect(parseQueryUrl(url)).toMatchObject({
        a: "1",
        b: "2",
        c: "test"
      })
    });

    it('should parse fragment query ', function () {
      const url = '#a=1&b=2&c=test';
      expect(parseQueryUrl(url)).toMatchObject({
        a: "1",
        b: "2",
        c: "test"
      })
    });

    it('should parse url with empty params ', function () {
      const url = '?a=&b=2&c=test';
      expect(parseQueryUrl(url)).toMatchObject({
        a: "",
        b: "2",
        c: "test"
      })
    });

    it('should decode encoded params', function () {
      const url = '?a=hello%20world'
      expect(parseQueryUrl(url)).toMatchObject({
        a: 'hello world'
      })
    });

  })

});
