import { severities, Severity } from "./severity.ts"
import { loadState, saveSession, saveSync } from "./state.ts"

export async function handleCodeRabbitAllToggle(
	this: HTMLInputElement,
	_ev: Event,
): Promise<void> {
	const state = await loadState()

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
}

export function handleCustomBotAllToggle(
	this: HTMLInputElement,
	_ev: Event,
): void {
	console.log("checked", this.checked)
}

export function handleAddCustomBotsClick(
	this: HTMLButtonElement,
	_ev: Event,
): void {
	console.log("Add Custom Bots clicked")
}

export function handleAddCustomBotsKey(
	this: HTMLInputElement,
	ev: KeyboardEvent,
): void {
	if (ev.key !== "Enter") return
	console.log("Add Custom Bots clicked via Enter key")
}

export async function handleSaveAsDefault(
	this: HTMLButtonElement,
	_ev: Event,
): Promise<void> {
	const state = await loadState()
	await saveSync(state)
}
