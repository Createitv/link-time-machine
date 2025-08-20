import { WaybackMachine } from "~features/wayback-machine"
import "~i18n"
import "~style.css"

function IndexPopup() {
  return (
    <div className="plasmo-min-h-screen plasmo-bg-white">
      <WaybackMachine />
    </div>
  )
}

export default IndexPopup
