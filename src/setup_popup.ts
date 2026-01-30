import {
	handleAddCustomBotsClick,
	handleAddCustomBotsKey,
	handleCodeRabbitAllToggle,
	handleCustomBotAllToggle,
	handleSaveAsDefault,
} from "./popup_handlers.ts"
import { register } from "./register.ts"
import { scanSeverities } from "./scripting.ts"
import { newSeverityCount, severities, type SeverityCount } from "./severity.ts"
import type { State } from "./state.ts"
import { loadState } from "./state.ts"
import { getTabId } from "./tabs.ts"
import { htmlSeverity } from "./templates/severity.ts"

export interface PopupContext {
	readonly state: State
	readonly tabId: number | undefined
}

async function getSeveritiesFromTab(
	tabId: number | undefined,
): Promise<SeverityCount> {
	if (!tabId) return newSeverityCount()

	const result = await scanSeverities(tabId)
	if (!result) return newSeverityCount()

	return result
}

export async function setupPopup(): Promise<PopupContext> {
	register("#addBotBtn", HTMLButtonElement, "click", handleAddCustomBotsClick)

	register(
		"#botNameInput",
		HTMLInputElement,
		"keypress",
		handleAddCustomBotsKey,
	)

	register(
		"#coderabbitAllCheckbox",
		HTMLInputElement,
		"change",
		handleCodeRabbitAllToggle,
	)

	register(
		"#customBotAllCheckbox",
		HTMLInputElement,
		"change",
		handleCustomBotAllToggle,
	)

	register("#saveAsDefaultBtn", HTMLButtonElement, "click", handleSaveAsDefault)

	const state = await loadState()
	const tabId = await getTabId()
	const foundSeverities = await getSeveritiesFromTab(tabId)

	for (const severity of severities) {
		const container = document.getElementById("severityControls")
		if (!container) throw new Error("severityControls container not found")

		const newControl = htmlSeverity({
			checked: state.coderabbit.visibilityState[severity],
			count: foundSeverities[severity],
			severity,
		})

		container.appendChild(newControl)
	}

	return { state, tabId }
}
