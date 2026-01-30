import { storage } from "webextension-polyfill"
import { Severity } from "./severity.js"
import { isSeverity } from "./severity.ts"
import { getTabId } from "./tabs.ts"

export type CustomBotsState = Record<string, boolean>
export type VisibilityState = Record<Severity, boolean>

interface CodeRabbitState {
	showAllState: boolean
	visibilityState: VisibilityState
}

export interface State extends Record<string, unknown> {
	coderabbit: CodeRabbitState
	customBots: CustomBotsState
}

function getSessionKey(tabId: number): string {
	return `session_${tabId}`
}

function isCodeRabbitState(value: unknown): value is CodeRabbitState {
	if (!value || typeof value !== "object") return false
	if (!("showAllState" in value) || !("visibilityState" in value)) return false
	if (!isVisibilityState(value.visibilityState)) return false
	if (typeof value.showAllState !== "boolean") return false
	return true
}

function isCustomBotsState(value: unknown): value is CustomBotsState {
	if (!value || typeof value !== "object") return false

	return Object.entries(value).every(
		([k, v]) => typeof k === "string" && typeof v === "boolean",
	)
}

function isState(value: unknown): value is State {
	if (!value || typeof value !== "object") return false
	if (!("coderabbit" in value) || !("customBots" in value)) return false
	if (!isCodeRabbitState(value.coderabbit)) return false
	if (!isCustomBotsState(value.customBots)) return false
	return true
}

export function isVisibilityState(value: unknown): value is VisibilityState {
	if (!value || typeof value !== "object") return false

	return Object.entries(value).every(
		([k, v]) => isSeverity(k) && typeof v === "boolean",
	)
}

async function loadSession(): Promise<State | undefined> {
	const tabId = await getTabId()
	if (!tabId) return

	const sessionKey = getSessionKey(tabId)
	const session = await storage.session.get(sessionKey)
	if (!isState(session)) {
		console.warn("Session state is invalid", { session })
		return
	}
	return session
}

export async function loadState(): Promise<State> {
	const session = await loadSession()
	if (session) return session

	const sync = await loadSync()
	if (sync) return sync

	return newState()
}

async function loadSync() {
	const sync = await storage.sync.get(["coderabbit", "customBots"])
	if (!isState(sync)) {
		console.warn("Sync state is invalid", { sync })
		return
	}

	return sync
}

function newState(): State {
	return {
		coderabbit: {
			visibilityState: {
				[Severity.Critical]: true,
				[Severity.Major]: true,
				[Severity.Minor]: true,
			},
			showAllState: true,
		},
		customBots: {},
	}
}

export async function saveSession(state: State): Promise<void> {
	return storage.session.set(state)
}

export async function saveSync(state: State): Promise<void> {
	return storage.sync.set(state)
}

if (!isState(newState()))
	throw new TypeError("defaultState is not a valid State")
