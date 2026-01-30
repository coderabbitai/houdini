import { applyFilters } from "./scripting.ts"
import type { PopupContext } from "./setup_popup.ts"

export async function setupTab(popup: PopupContext): Promise<void> {
	if (!popup.tabId) return
	await applyFilters(popup.tabId, popup.state)
}
