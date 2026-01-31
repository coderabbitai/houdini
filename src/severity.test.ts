import { describe, test } from "vitest"
import { isSeverity, isSeverityCount, Severity } from "./severity.ts"

describe("isSeverity", () => {
	test("true", ({ expect }) => {
		const severity = isSeverity("Critical")
		expect(severity).toBe(true)
	})

	test("false", ({ expect }) => {
		const severity = isSeverity("Unknown")
		expect(severity).toBe(false)
	})
})

describe("isSeverityCount", () => {
	test("true", ({ expect }) => {
		const count = isSeverityCount({
			[Severity.Critical]: 0,
			[Severity.Major]: 0,
			[Severity.Minor]: 0,
		})
		expect(count).toBe(true)
	})

	test("false", ({ expect }) => {
		const count = isSeverityCount({
			Unknown: 0,
		})
		expect(count).toBe(false)
	})
})
