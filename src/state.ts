import { storage } from "webextension-polyfill"
import { Severity } from "./severity.js"
import { isSeverity } from "./severity.ts"

type CustomBotsState = Record<string, boolean>
type VisibilityState = Record<Severity, boolean>

interface CodeRabbitState {
	readonly showAllState: boolean
	readonly visibilityState: VisibilityState
}

interface State extends Record<string, unknown> {
	readonly coderabbit: CodeRabbitState
	readonly customBots: CustomBotsState
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

function isVisibilityState(value: unknown): value is VisibilityState {
	if (!value || typeof value !== "object") return false

	return Object.entries(value).every(
		([k, v]) => isSeverity(k) && typeof v === "boolean",
	)
}

export async function loadState(): Promise<State> {
	const stored = await storage.sync.get(["coderabbit", "customBots"])
	if (!isState(stored)) {
		console.warn("Stored state is invalid, using default state", { stored })
		return defaultState()
	}

	return stored
}

export async function saveState(state: State): Promise<void> {
	return storage.sync.set(state)
}

function defaultState(): State {
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

if (!isState(defaultState()))
	throw new TypeError("defaultState is not a valid State")
