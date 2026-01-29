import {
	handleAddCustomBotsClick,
	handleAddCustomBotsKey,
	handleCodeRabbitAllToggle,
	handleCustomBotAllToggle,
	handleSaveAsDefault,
} from "./popup_handlers.ts"
import { register } from "./register.ts"
import { severities } from "./severity.ts"
import { loadState } from "./state.ts"
import { htmlSeverity } from "./templates/severity.ts"

register("#addBotBtn", HTMLButtonElement, "click", handleAddCustomBotsClick)
register("#botNameInput", HTMLInputElement, "keypress", handleAddCustomBotsKey)
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
