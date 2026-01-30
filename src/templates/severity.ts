import { applyFilters } from "../scripting.ts"
import type { Severity } from "../severity.ts"
import { loadState, saveSession } from "../state.ts"
import html from "./severity.template.html"

const template = document.createElement("template")
template.innerHTML = html

interface Props {
	readonly checked: boolean
	readonly count: number
	readonly severity: Severity
	readonly tabId: number | undefined
}

export function htmlSeverity(props: Props): HTMLDivElement {
	// 1. Clone the template; this will become our component
	const clone = template.content.cloneNode(true)
	if (!(clone instanceof DocumentFragment))
		throw new TypeError("cloneNode did not return a DocumentFragment", {
			cause: { clone, template },
		})

	// 2. Extract references from the component
	const refs = {
		name: clone.querySelector<HTMLSpanElement>('[data-ref="name"]'),
		count: clone.querySelector<HTMLSpanElement>('[data-ref="count"]'),
		checkbox: clone.querySelector<HTMLInputElement>('[data-ref="checkbox"]'),
	}
	if (!refs.name || !refs.count || !refs.checkbox)
		throw new Error("Missing required refs", {
			cause: { refs, clone },
		})

	// 3. Setup the component
	refs.name.textContent = props.severity
	refs.count.textContent = `(${props.count})`
	refs.checkbox.checked = props.checked
	refs.checkbox.setAttribute("data-severity", props.severity)
	refs.checkbox.addEventListener("change", toggleSeverity(props))

	// 4. Extract the HTMLElement from the component and return it
	const firstChild = clone.firstChild
	if (!(firstChild instanceof HTMLDivElement))
		throw new TypeError("firstChild is not an HTMLElement", {
			cause: { firstChild, clone },
		})
	return firstChild
}

function toggleSeverity(props: Props) {
	return (ev: Event) => {
		const checkbox = ev.target
		if (!(checkbox instanceof HTMLInputElement))
			throw new TypeError(
				"toggleSeverity must be registered on an HTMLInputElement",
				{
					cause: { ev, checkbox },
				},
			)

		void loadState(props.tabId).then(async state => {
			state.coderabbit.visibilityState[props.severity] = checkbox.checked
			await saveSession(state)

			if (props.tabId) await applyFilters(props.tabId, state)
		})
	}
}
