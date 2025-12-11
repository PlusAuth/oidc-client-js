/*
Jitbit TabUtils - helper for multiple browser tabs. version 1.0
https://github.com/jitbit/TabUtils
- executing "interlocked" function call - only once per multiple tabs
- broadcasting a message to all tabs (including the current one) with some message "data"
- handling a broadcasted message
MIT license: https://github.com/jitbit/TabUtils/blob/master/LICENSE
*/

import type { EventEmitter } from "../helpers"

const currentTabId = `${performance.now()}:${(Math.random() * 1000000000) | 0}`
const handlers: Record<string, any> = {}

export class TabUtils {
  keyPrefix: string

  private events: EventEmitter<any>

  constructor(kid: string, fallbackEvents: EventEmitter<any>) {
    this.keyPrefix = kid
    this.events = fallbackEvents
  }

  //runs code only once in multiple tabs
  //the lock holds for 4 seconds (in case the function is async and returns right away, for example, an ajax call intiated)
  //then it is cleared
  CallOnce(lockname: string, fn: () => void, timeout = 3000): void {
    if (!lockname) throw "empty lockname"

    if (!window.localStorage) {
      //no local storage. old browser. screw it, just run the function
      fn()
      return
    }

    const localStorageKey = this.keyPrefix + lockname

    localStorage.setItem(localStorageKey, currentTabId)
    //re-read after a delay (after all tabs have saved their tabIDs into ls)
    setTimeout(() => {
      if (localStorage.getItem(localStorageKey) === currentTabId) fn()
    }, 150)

    //cleanup - release the lock after 3 seconds and on window unload (just in case user closed the window while the lock is still held)
    setTimeout(() => {
      localStorage.removeItem(localStorageKey)
    }, timeout)
  }

  BroadcastMessageToAllTabs(messageId: string, eventData: any): void {
    //now we also need to manually execute handler in the current tab too, because current tab does not get 'storage' events
    try {
      handlers[messageId](eventData)
    } catch {}

    if (!window.localStorage) {
      this.events.emit(messageId, eventData)
      return //no local storage. old browser
    }

    const data = {
      data: eventData,
      timeStamp: Date.now(),
    } //add timestamp because overwriting same data does not trigger the event

    //this triggers 'storage' event for all other tabs except the current tab
    localStorage.setItem(`${this.keyPrefix}event${messageId}`, JSON.stringify(data))

    //cleanup
    setTimeout(() => {
      localStorage.removeItem(`${this.keyPrefix}event${messageId}`)
    }, 3000)
  }

  OnBroadcastMessage(messageId: string, fn: (data: any) => void): void {
    handlers[messageId] = fn
    if (!window.localStorage) {
      this.events.on(messageId, fn)
      return //no local storage. old browser
    }

    //first register a handler for "storage" event that we trigger above
    window.addEventListener("storage", (ev) => {
      if (ev.key !== `${this.keyPrefix}event${messageId}`) return // ignore other keys
      if (!ev.newValue) return //called by cleanup?
      const messageData = JSON.parse(ev.newValue)
      fn(messageData.data)
    })
  }
}
