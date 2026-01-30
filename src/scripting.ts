/**
 * Bridge between the popup and injected scripts on the GitHub page.
 *
 * @module
 */

import { scripting } from "webextension-polyfill"
import { applyVisibilityFilter, getAvailableSeverities } from "./injected.js"
import { isSeverityCount, type SeverityCount } from "./severity.ts"
import type { State } from "./state.ts"

/** Apply visibility filters to comments on the GitHub page. */
export async function applyFilters(tabId: number, state: State): Promise<void> {
	await scripting
		.executeScript({
			target: { tabId },
			func: applyVisibilityFilter,
			args: [state],
		})
		.catch((error: unknown) => {
			console.error("Error applying filters", { error })
		})
}

/** Scan the GitHub page for CodeRabbit comments by severity level. */
export async function scanSeverities(
	tabId: number,
): Promise<SeverityCount | undefined> {
	const results = await scripting
		.executeScript({
			target: { tabId },
			func: getAvailableSeverities,
		})
		.catch((error: unknown) => {
			console.error("Error scanning severities", { error })
			return
		})

	const { result } = results?.[0] ?? {}

	if (!result) {
		console.error("No scan results", { results })
		return
	}

	if (!isSeverityCount(result)) {
		console.error("Invalid scan results", { results })
		return
	}

	return result
}
