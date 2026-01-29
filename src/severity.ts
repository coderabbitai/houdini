export const Severity = {
	Critical: "Critical",
	Major: "Major",
	Minor: "Minor",
} as const

export type Severity = (typeof Severity)[keyof typeof Severity]

export const severities: Severity[] = Object.values(Severity)
