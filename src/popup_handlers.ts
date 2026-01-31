import { applyFilters } from "./scripting.ts"
import { severities, Severity } from "./severity.ts"
import { loadState, saveSession, saveSync } from "./state.ts"
import { getTabId } from "./tabs.ts"

export function handleAddCustomBotsClick(this: HTMLButtonElement): void {
	console.log("Add Custom Bots clicked")
}

export function handleAddCustomBotsKey(
	this: HTMLInputElement,
	ev: KeyboardEvent,
): void {
	if (ev.key !== "Enter") return
	console.log("Add Custom Bots clicked via Enter key")
}

export async function handleCodeRabbitAllToggle(
	this: HTMLInputElement,
): Promise<void> {
	const tabId = await getTabId()
	const state = await loadState(tabId)

	state.coderabbit.showAllState = this.checked
	state.coderabbit.visibilityState = {
		[Severity.Critical]: this.checked,
		[Severity.Major]: this.checked,
		[Severity.Minor]: this.checked,
	}

	await saveSession(state)

	for (const severity of severities) {
		const checkbox = document.querySelector<HTMLInputElement>(
			`#severityControls input[data-severity="${severity}"]`,
		)

		if (!checkbox) {
			console.error("Checkbox not found", { severity })
			continue
		}

		checkbox.checked = this.checked
	}

	if (tabId) await applyFilters(tabId, state)
}

export function handleCustomBotAllToggle(this: HTMLInputElement): void {
	console.log("checked", this.checked)
}

export async function handleSaveAsDefault(
	this: HTMLButtonElement,
): Promise<void> {
	const tabId = await getTabId()
	const state = await loadState(tabId)
	await saveSync(state)
	if (tabId) await applyFilters(tabId, state)
}
