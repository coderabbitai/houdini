export type Severity = (typeof Severity)[keyof typeof Severity]
export type SeverityCount = Record<Severity, number>

export function isSeverity(value: unknown): value is Severity {
	return Object.values<unknown>(Severity).includes(value)
}

export function isSeverityCount(value: unknown): value is SeverityCount {
	if (!value || typeof value !== "object") return false

	return Object.entries(value).every(
		([k, v]) => isSeverity(k) && typeof v === "number",
	)
}

export function newSeverityCount(): SeverityCount {
	return { [Severity.Critical]: 0, [Severity.Major]: 0, [Severity.Minor]: 0 }
}

export const Severity = {
	Critical: "Critical",
	Major: "Major",
	Minor: "Minor",
} as const

export const severities: Severity[] = Object.values(Severity)
