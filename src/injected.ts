/**
 * These functions will be injected using `scripting.executeScript`. They cannot
 * import outside code.
 *
 * @module
 */

import type { Severity } from "./severity.ts"
import type { CustomBotsState } from "./state.ts"

export function getAvailableSeverities(): Record<Severity, number> {
	function includesSeverity(text: string): Severity | undefined {
		if (text.includes("Critical")) return "Critical"
		if (text.includes("Major")) return "Major"
		if (text.includes("Minor")) return "Minor"
		return
	}

	const comments = Array.from(
		document.querySelectorAll(
			'turbo-frame[id^="review-thread-or-comment-id-"]',
		),
	)

	const counts: Record<Severity, number> = {
		["Critical"]: 0,
		["Major"]: 0,
		["Minor"]: 0,
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

export function applyVisibilityFilter(
	coderabbitVisibilityState: Record<Severity, boolean>,
	coderabbitShowAllState: boolean,
	customBots: CustomBotsState,
): void {
	function getTurboFrameSeverity(turboFrame: HTMLElement) {
		const inlineContainers = Array.from(
			turboFrame.querySelectorAll(".js-inline-comments-container"),
		)

		for (const inlineContainer of inlineContainers) {
			const authorLink = inlineContainer.querySelector<HTMLAnchorElement>(
				'a.author[href="/apps/coderabbitai"]',
			)

			if (authorLink) {
				const commentBody =
					inlineContainer.querySelector<HTMLDivElement>(".comment-body")
				if (!commentBody) continue

				const ems = Array.from(commentBody.querySelectorAll<HTMLElement>("em"))
				for (const em of ems) {
					const text = em.textContent.trim()
					if (text.includes("Critical")) return "Critical"
					if (text.includes("Major")) return "Major"
					if (text.includes("Minor")) return "Minor"
				}
			}
		}
		return null
	}

	function isCustomBotHidden(timelineItem: HTMLDivElement) {
		if (Object.keys(customBots).length === 0) return false

		const authorLinks = Array.from(
			timelineItem.querySelectorAll<HTMLAnchorElement>("a.author"),
		)

		for (const authorLink of authorLinks) {
			const authorName = authorLink.textContent.trim().toLowerCase()

			for (const [botName, showAll] of Object.entries(customBots)) {
				if (authorName.includes(botName.toLowerCase())) {
					return !showAll
				}
			}
		}

		return false
	}

	function isCodeRabbit(container: HTMLDivElement) {
		return !!container.querySelector<HTMLAnchorElement>(
			'a.author[href="/apps/coderabbitai"]',
		)
	}

	function updateTurboFrameVisibility(
		turboFrames: HTMLElement[],
		coderabbitVisibilityState: Record<Severity, boolean>,
	) {
		let hasVisibleTurboFrame = false

		for (const turboFrame of turboFrames) {
			const severity = getTurboFrameSeverity(turboFrame)

			if (severity && coderabbitVisibilityState[severity]) {
				turboFrame.style.display = ""
				turboFrame.removeAttribute("data-coderabbit-hidden")
				hasVisibleTurboFrame = true
			} else {
				turboFrame.style.display = "none"
				turboFrame.setAttribute("data-coderabbit-hidden", "true")
			}
		}

		return hasVisibleTurboFrame
	}

	const allTimelineItems = Array.from(
		document.querySelectorAll<HTMLDivElement>(".js-timeline-item"),
	)

	for (const container of allTimelineItems) {
		if (isCustomBotHidden(container)) {
			container.style.display = "none"
			container.setAttribute("data-custom-bot-hidden", "true")
			continue
		}
		container.removeAttribute("data-custom-bot-hidden")

		if (!isCodeRabbit(container)) {
			container.style.display = ""
			continue
		}

		const turboFrames = Array.from(
			container.querySelectorAll<HTMLElement>(
				'turbo-frame[id^="review-thread-or-comment-id-"]',
			),
		)

		if (!coderabbitShowAllState) {
			container.style.display = ""
			container.removeAttribute("data-coderabbit-hidden")

			if (!updateTurboFrameVisibility(turboFrames, coderabbitVisibilityState)) {
				container.style.display = "none"
				container.setAttribute("data-coderabbit-hidden", "true")
			}

			continue
		}

		container.style.display = ""
		container.removeAttribute("data-coderabbit-hidden")

		for (const turboFrame of turboFrames) {
			const severity = getTurboFrameSeverity(turboFrame)

			if (severity && !coderabbitVisibilityState[severity]) {
				turboFrame.style.display = "none"
				turboFrame.setAttribute("data-coderabbit-hidden", "true")
				continue
			}

			turboFrame.style.display = ""
			turboFrame.removeAttribute("data-coderabbit-hidden")
		}
	}
}
