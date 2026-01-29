import { register } from "./register.ts"

register(
	"#coderabbitAllCheckbox",
	HTMLInputElement,
	"change",
	handleCodeRabbitAllToggle,
)

function handleCodeRabbitAllToggle(this: HTMLInputElement, _ev: Event) {
	console.log("checked", this.checked)
}

register(
	"#customBotAllCheckbox",
	HTMLInputElement,
	"change",
	handleCustomBotAllToggle,
)

function handleCustomBotAllToggle(this: HTMLInputElement, _ev: Event) {
	console.log("checked", this.checked)
}

register("#addBotBtn", HTMLButtonElement, "click", handleAddCustomBots)

function handleAddCustomBots(this: HTMLButtonElement, _ev: Event) {
	console.log("Add Custom Bots clicked")
}

register("#botNameInput", HTMLInputElement, "keypress", handleAddCustomBots2)

function handleAddCustomBots2(this: HTMLInputElement, ev: KeyboardEvent) {
	if (ev.key !== "Enter") return
	console.log("Add Custom Bots clicked via Enter key")
}

register("#saveAsDefaultBtn", HTMLButtonElement, "click", handleSaveAsDefault)

function handleSaveAsDefault(this: HTMLButtonElement, _ev: Event) {
	console.log("Save as Default clicked")
}

import { severities } from "./severity.ts"
import { loadState } from "./state.ts"
import { htmlSeverity } from "./templates/severity.ts"

const state = await loadState()
for (const severity of severities) {
	const container = document.getElementById("severityControls")
	if (!container) throw new Error("severityControls container not found")

	const newControl = htmlSeverity({
		severity,
		count: 0,
		checked: state.coderabbit.visibilityState[severity],
	})
	container.appendChild(newControl)
}
