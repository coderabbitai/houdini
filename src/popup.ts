import { setupPopup } from "./setup_popup.ts"
import { setupTab } from "./setup_tab.ts"

const popup = await setupPopup()
await setupTab(popup)
