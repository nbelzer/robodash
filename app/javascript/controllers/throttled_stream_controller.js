import { Controller } from "@hotwired/stimulus"
import { Turbo } from "@hotwired/turbo-rails"

// Renders at most one refresh per interval from the wrapped turbo stream,
// always ending with the latest message so the newest state shows up.
export default class extends Controller {
  static values = { interval: { type: Number, default: 5000 } }

  connect() {
    this.lastRenderedAt = 0
    this.source = this.element.querySelector("turbo-cable-stream-source")
    Turbo.disconnectStreamSource(this.source)
    this.source.addEventListener("message", this.receive)
  }

  disconnect() {
    clearTimeout(this.pending)
    this.source.removeEventListener("message", this.receive)
    Turbo.connectStreamSource(this.source)
  }

  receive = (event) => {
    if (!event.data.includes('action="refresh"')) return Turbo.renderStreamMessage(event.data)

    this.latestMessage = event.data
    const wait = this.lastRenderedAt + this.intervalValue - Date.now()

    if (wait <= 0) {
      this.render()
    } else if (!this.pending) {
      this.pending = setTimeout(() => {
        this.pending = null
        this.render()
      }, wait)
    }
  }

  render() {
    this.lastRenderedAt = Date.now()
    Turbo.renderStreamMessage(this.latestMessage)
  }
}
