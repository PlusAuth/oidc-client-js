export class Timer {
  private now: () => number

  private _timerHandle: any

  private _expiration!: number

  constructor(currentTimeInMillisFunc = () => Date.now()) {
    this.now = currentTimeInMillisFunc
  }

  start(duration: number, callback: () => void) {
    if (duration <= 0) {
      duration = 1
    }
    const expiration = this.now() / 1000 + duration
    if (this._expiration === expiration && this._timerHandle) {
      return
    }

    this.stop()

    this._expiration = expiration

    // prevent device sleep and delayed timers
    let timerDuration = 5
    if (duration < timerDuration) {
      timerDuration = duration
    }
    this._timerHandle = setInterval(() => {
      if (this._expiration <= this.now() / 1000) {
        this.stop()
        callback()
      }
    }, timerDuration * 1000)
  }

  stop() {
    if (this._timerHandle) {
      clearInterval(this._timerHandle)
      this._timerHandle = null
    }
  }
}
