import { describe, expect, it } from "vitest"
import { EventEmitter as Emitter } from "../../src/helpers"

class Custom extends Emitter<any> {}

describe("Custom", () => {
  describe("with Emitter.call(this)", () => {
    it("should work", async () => {
      const emitter = new Custom()

      const p = new Promise<void>((resolve) => {
        emitter.on("foo", resolve)
      })

      emitter.emit("foo")

      await p
    })
  })
})

describe("Emitter", () => {
  describe(".on(event, fn)", () => {
    it("should add listeners", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      emitter.on("foo", (val) => {
        calls.push("one", val)
      })

      emitter.on("foo", (val) => {
        calls.push("two", val)
      })

      emitter.emit("foo", 1)
      emitter.emit("bar", 1)
      emitter.emit("foo", 2)

      expect(calls).toStrictEqual(["one", 1, "two", 1, "one", 2, "two", 2])
    })

    it("should add listeners for events which are same names with methods of Object.prototype", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      emitter.on("constructor", (val) => {
        calls.push("one", val)
      })

      emitter.on("__proto__", (val) => {
        calls.push("two", val)
      })

      emitter.emit("constructor", 1)
      emitter.emit("__proto__", 2)

      expect(calls).toStrictEqual(["one", 1, "two", 2])
    })
  })

  describe(".once(event, fn)", () => {
    it("should add a single-shot listener", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      emitter.once("foo", (val) => {
        calls.push("one", val)
      })

      emitter.emit("foo", 1)
      emitter.emit("foo", 2)
      emitter.emit("foo", 3)
      emitter.emit("bar", 1)

      expect(calls).toStrictEqual(["one", 1])
    })
  })

  describe(".off(event, fn)", () => {
    it("should remove a listener", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      function one() {
        calls.push("one")
      }
      function two() {
        calls.push("two")
      }

      emitter.on("foo", one)
      emitter.on("foo", two)
      emitter.off("foo", two)

      emitter.emit("foo")

      expect(calls).toStrictEqual(["one"])
    })

    it("should work with .once()", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      function one() {
        calls.push("one")
      }

      emitter.once("foo", one)
      emitter.once("fee", one)
      emitter.off("foo", one)

      emitter.emit("foo")

      expect(calls).toStrictEqual([])
    })

    it("should work when called from an event", () => {
      const emitter = new Emitter()
      let called

      function b() {
        called = true
      }
      emitter.on("tobi", () => {
        emitter.off("tobi", b)
      })
      emitter.on("tobi", b)
      emitter.emit("tobi")
      expect(called).toBeTruthy()
      called = false
      emitter.emit("tobi")
      expect(called).toBeFalsy()
    })
  })

  describe(".off(event)", () => {
    it("should remove all listeners for an event", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      function one() {
        calls.push("one")
      }
      function two() {
        calls.push("two")
      }

      emitter.on("foo", one)
      emitter.on("foo", two)
      emitter.off("foo")
      emitter.off("bar")

      emitter.emit("foo")
      emitter.emit("foo")

      expect(calls).toStrictEqual([])
    })

    it("should remove event array to avoid memory leak", () => {
      const emitter = new Emitter()
      const _calls = []

      function cb() {}

      emitter.on("foo", cb)
      emitter.off("foo", cb)

      expect(emitter.callbacks).not.toHaveProperty("$foo")
    })

    it("should only remove the event array when the last subscriber unsubscribes", () => {
      const emitter = new Emitter()
      const _calls = []

      function cb1() {}
      function cb2() {}

      emitter.on("foo", cb1)
      emitter.on("foo", cb2)
      emitter.off("foo", cb1)

      expect(emitter.callbacks).toHaveProperty("$foo")
    })
  })

  describe(".off()", () => {
    it("should remove all listeners", () => {
      const emitter = new Emitter()
      const calls: any[] = []

      function one() {
        calls.push("one")
      }
      function two() {
        calls.push("two")
      }

      emitter.on("foo", one)
      emitter.on("bar", two)

      emitter.emit("foo")
      emitter.emit("bar")

      emitter.off()

      emitter.emit("foo")
      emitter.emit("bar")

      expect(calls).toStrictEqual(["one", "two"])
    })
  })
})
