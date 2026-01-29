import type { Tabs } from "webextension-polyfill"
import { tabs } from "webextension-polyfill"

export async function getCurrentTab(): Promise<Tabs.Tab | undefined> {
	const [tab] = await tabs.query({ active: true, currentWindow: true })
	return tab
}

function isValidTab(tab: Tabs.Tab | undefined): Error | Tabs.Tab {
	if (!tab) return new Error("No active tab found", { cause: { tab } })

	if (!tab.url) return new Error("No URL", { cause: { tab } })

	const url = new URL(tab.url)
	if (url.hostname !== "github.com")
		return new Error("Not a GitHub URL", { cause: { tab, url } })

	if (!tab.id)
		return new Error("No tab ID", { cause: { tab, url, id: tab.id } })

	return tab
}

/** Get the current tab's ID while ignoring validations. */
export async function getTabId(): Promise<number | undefined> {
	const tab = await getCurrentTab()

	const valid = isValidTab(tab)
	if (valid instanceof Error) return

	return valid.id
}
