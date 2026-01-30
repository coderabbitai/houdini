import { Severity } from "./severity.ts"

export function getAvailableSeverities(): Record<Severity, number> {
	const comments = Array.from(
		document.querySelectorAll(
			'turbo-frame[id^="review-thread-or-comment-id-"]',
		),
	)

	const counts: Record<Severity, number> = {
		[Severity.Critical]: 0,
		[Severity.Major]: 0,
		[Severity.Minor]: 0,
	}

	for (const comment of comments) {
		const author = comment.querySelector<HTMLAnchorElement>(
			'a.author, a[data-hovercard-type="user"]',
		)

		if (author?.textContent.trim().toLowerCase().includes("coderabbit")) {
			const body = comment.querySelector(".comment-body")
			if (!body) continue

			const ems = Array.from(body.querySelectorAll<HTMLElement>("em"))
			for (const em of ems) {
				const text = em.textContent.trim()

				const severity = includesSeverity(text)
				if (!severity) continue

				counts[severity] = (counts[severity] || 0) + 1
				break
			}
		}
	}

	return counts
}

function includesSeverity(text: string): Severity | undefined {
	if (text.includes(Severity.Critical)) return Severity.Critical
	if (text.includes(Severity.Major)) return Severity.Major
	if (text.includes(Severity.Minor)) return Severity.Minor
	return
}
