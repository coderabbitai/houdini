// ============================================================================
// CONSTANTS & DEFAULTS
// ============================================================================

const SEVERITIES = ["Critical", "Major", "Minor"]

const DEFAULT_STATE = {
	coderabbit: {
		visibilityState: {
			Critical: true,
			Major: true,
			Minor: true,
		},
		showAllState: true,
	},
	customBots: {}, // { "botName": true|false }
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class FilterState {
	constructor() {
		this.currentState = this.getDefaultState()
	}

	getDefaultState() {
		return {
			coderabbit: {
				visibilityState: { ...DEFAULT_STATE.coderabbit.visibilityState },
				showAllState: DEFAULT_STATE.coderabbit.showAllState,
			},
			customBots: { ...DEFAULT_STATE.customBots },
		}
	}

	validateState(state) {
		if (!state || typeof state !== "object") {
			return this.getDefaultState()
		}

		const validated = {
			coderabbit: {
				visibilityState: {},
				showAllState: state.coderabbit?.showAllState ?? true,
			},
			customBots: {},
		}

		SEVERITIES.forEach(severity => {
			validated.coderabbit.visibilityState[severity] =
				state.coderabbit?.visibilityState?.[severity] ?? true
		})

		if (state.customBots && typeof state.customBots === "object") {
			Object.entries(state.customBots).forEach(([botName, showAll]) => {
				if (typeof botName === "string" && botName.trim()) {
					validated.customBots[botName.toLowerCase().trim()] = Boolean(showAll)
				}
			})
		}

		return validated
	}

	getSessionKey(tabId) {
		return `session_${tabId}`
	}

	async load(tabId) {
		try {
			if (!chrome?.storage) {
				console.warn("chrome.storage not available, using defaults")
				this.currentState = this.getDefaultState()
				return this.currentState
			}

			const sessionKey = this.getSessionKey(tabId)
			const sessionResult = await chrome.storage.session.get(sessionKey)

			if (sessionResult[sessionKey]) {
				console.log("Loading from session storage for tab", tabId)
				this.currentState = this.validateState(sessionResult[sessionKey])
				return this.currentState
			}

			const result = await chrome.storage.sync.get(["coderabbit", "customBots"])
			console.log("Loading from global storage:", result)
			this.currentState = this.validateState(result)
			return this.currentState
		} catch (error) {
			console.error("Error loading settings:", error)
			this.currentState = this.getDefaultState()
			return this.currentState
		}
	}

	async saveToSession(tabId) {
		try {
			if (!chrome?.storage?.session) {
				console.warn("chrome.storage.session not available")
				return
			}

			const sessionKey = this.getSessionKey(tabId)
			await chrome.storage.session.set({
				[sessionKey]: {
					coderabbit: {
						visibilityState: {
							...this.currentState.coderabbit.visibilityState,
						},
						showAllState: this.currentState.coderabbit.showAllState,
					},
					customBots: { ...this.currentState.customBots },
				},
			})
			console.log("Saved to session storage for tab", tabId)
		} catch (error) {
			console.error("Error saving to session:", error)
		}
	}

	async saveAsDefault() {
		try {
			if (!chrome?.storage?.sync) {
				console.error("chrome.storage.sync not available")
				return false
			}

			await chrome.storage.sync.set({
				coderabbit: {
					visibilityState: this.currentState.coderabbit.visibilityState,
					showAllState: this.currentState.coderabbit.showAllState,
				},
				customBots: this.currentState.customBots,
			})
			console.log("Saved as global defaults:", this.currentState)
			return true
		} catch (error) {
			console.error("Error saving defaults:", error)
			return false
		}
	}

	setSeverityVisibility(severity, isVisible) {
		if (SEVERITIES.includes(severity)) {
			this.currentState.coderabbit.visibilityState[severity] =
				Boolean(isVisible)
		}
	}

	setShowAll(showAll) {
		this.currentState.coderabbit.showAllState = Boolean(showAll)
		SEVERITIES.forEach(severity => {
			this.currentState.coderabbit.visibilityState[severity] = showAll
		})
	}

	setCustomBot(botName, showAll) {
		if (typeof botName === "string" && botName.trim()) {
			const normalizedName = botName.toLowerCase().trim()
			this.currentState.customBots[normalizedName] = Boolean(showAll)
		}
	}

	removeCustomBot(botName) {
		if (typeof botName === "string") {
			const normalizedName = botName.toLowerCase().trim()
			delete this.currentState.customBots[normalizedName]
		}
	}

	getCustomBotNames() {
		return Object.keys(this.currentState.customBots)
	}

	get() {
		return {
			coderabbit: {
				visibilityState: { ...this.currentState.coderabbit.visibilityState },
				showAllState: this.currentState.coderabbit.showAllState,
			},
			customBots: { ...this.currentState.customBots },
		}
	}
}

const filterState = new FilterState()

// ============================================================================
// UI CONTROLLER
// ============================================================================

class UIController {
	constructor() {
		this.severityToggles = {}
		this.currentTabId = null
	}

	async init() {
		try {
			const tab = await this.getCurrentTab()

			if (!this.validateTab(tab)) {
				return
			}

			this.currentTabId = tab.id
			await filterState.load(tab.id)
			this.updateCodeRabbitAllToggle()
			this.updateCustomBotUI()

			const severities = await this.scanSeverities(tab.id)
			this.buildSeverityControls(severities)
			this.setupEventListeners()
			await this.applyFilters()
		} catch (error) {
			console.error("Error initializing popup:", error)
			this.showStatus("Error initializing extension: " + error.message, "error")
		}
	}

	setupEventListeners() {
		const coderabbitAllCheckbox = document.getElementById(
			"coderabbitAllCheckbox",
		)
		if (coderabbitAllCheckbox) {
			coderabbitAllCheckbox.onchange = e =>
				this.handleCodeRabbitAllToggle(e.target.checked)
		}

		const customBotAllCheckbox = document.getElementById("customBotAllCheckbox")
		if (customBotAllCheckbox) {
			customBotAllCheckbox.onchange = e =>
				this.handleCustomBotAllToggle(e.target.checked)
		}

		const addBotBtn = document.getElementById("addBotBtn")
		if (addBotBtn) {
			addBotBtn.onclick = () => this.handleAddCustomBots()
		}

		const botNameInput = document.getElementById("botNameInput")
		if (botNameInput) {
			botNameInput.onkeypress = e => {
				if (e.key === "Enter") this.handleAddCustomBots()
			}
		}

		const saveAsDefaultBtn = document.getElementById("saveAsDefaultBtn")
		if (saveAsDefaultBtn) {
			saveAsDefaultBtn.onclick = () => this.handleSaveAsDefault()
		}
	}

	async getCurrentTab() {
		const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
		return tab
	}

	validateTab(tab) {
		if (!tab) {
			this.showStatus("Error: No active tab found", "error")
			return false
		}

		if (!tab.url || !tab.url.includes("github.com")) {
			this.showStatus("Please open a GitHub PR page", "error")
			return false
		}

		if (!tab.id) {
			this.showStatus("Error: Invalid tab ID", "error")
			return false
		}

		return true
	}

	async scanSeverities(tabId) {
		return new Promise(resolve => {
			chrome.scripting.executeScript(
				{
					target: { tabId },
					function: getAvailableSeverities,
				},
				results => {
					if (chrome.runtime.lastError) {
						console.error(
							"Error scanning severities:",
							chrome.runtime.lastError,
						)
						resolve({})
						return
					}

					if (!results?.[0]?.result) {
						console.error("Invalid scan results:", results)
						resolve({})
						return
					}

					resolve(results[0].result)
				},
			)
		})
	}

	buildSeverityControls(availableSeverities) {
		const container = document.getElementById("severityControls")
		if (!container) {
			console.error("Severity controls container not found")
			return
		}

		container.innerHTML = ""
		const state = filterState.get()

		SEVERITIES.forEach(severity => {
			const count = availableSeverities[severity] || 0
			if (count === 0) return

			const item = this.createSeverityFilterItem(
				severity,
				count,
				state.coderabbit.visibilityState[severity],
			)
			container.appendChild(item)
		})
	}

	createSeverityFilterItem(severity, count, isVisible) {
		const item = document.createElement("div")
		item.className = "filter-item"

		const label = document.createElement("div")
		label.className = "severity-label"
		label.innerHTML = `
      <span>${severity}</span>
      <span class="count">(${count})</span>
    `

		const toggle = document.createElement("label")
		toggle.className = "toggle-switch"

		const checkbox = document.createElement("input")
		checkbox.type = "checkbox"
		checkbox.checked = isVisible
		checkbox.onchange = e =>
			this.handleSeverityToggle(severity, e.target.checked)

		const slider = document.createElement("span")
		slider.className = "slider"

		toggle.appendChild(checkbox)
		toggle.appendChild(slider)
		item.appendChild(label)
		item.appendChild(toggle)

		this.severityToggles[severity] = checkbox
		return item
	}

	async handleCodeRabbitAllToggle(isChecked) {
		try {
			filterState.setShowAll(isChecked)
			Object.values(this.severityToggles).forEach(checkbox => {
				checkbox.checked = isChecked
			})
			await this.applyFilters()
		} catch (error) {
			console.error("Error toggling CodeRabbit all:", error)
			this.showStatus("Error toggling visibility", "error")
		}
	}

	async handleSeverityToggle(severity, isVisible) {
		try {
			filterState.setSeverityVisibility(severity, isVisible)
			await this.applyFilters()
		} catch (error) {
			console.error("Error toggling severity:", error)
			this.showStatus("Error toggling visibility", "error")
		}
	}

	updateCodeRabbitAllToggle() {
		const state = filterState.get()
		const checkbox = document.getElementById("coderabbitAllCheckbox")
		if (checkbox) {
			checkbox.checked = state.coderabbit.showAllState
		}
	}

	updateCustomBotUI() {
		const state = filterState.get()
		const listContainer = document.getElementById("customBotList")
		const allToggleContainer = document.getElementById("customBotAllToggle")

		if (!listContainer) return

		listContainer.innerHTML = ""
		const botNames = Object.keys(state.customBots)

		if (allToggleContainer) {
			if (botNames.length === 0) {
				allToggleContainer.style.display = "none"
			} else {
				allToggleContainer.style.display = ""
				this.updateCustomBotAllToggle()
			}
		}

		if (botNames.length === 0) {
			listContainer.innerHTML =
				'<div class="no-bots">No custom bot filters</div>'
			return
		}

		botNames.forEach(botName => {
			const showAll = state.customBots[botName]
			const item = this.createCustomBotItem(botName, showAll)
			listContainer.appendChild(item)
		})
	}

	updateCustomBotAllToggle() {
		const state = filterState.get()
		const botNames = Object.keys(state.customBots)

		if (botNames.length === 0) return

		const allShown = botNames.every(name => state.customBots[name] === true)
		const checkbox = document.getElementById("customBotAllCheckbox")
		if (checkbox) {
			checkbox.checked = allShown
		}
	}

	createCustomBotItem(botName, showAll) {
		const item = document.createElement("div")
		item.className = "custom-bot-item"

		const removeBtn = document.createElement("button")
		removeBtn.className = "remove-btn"
		removeBtn.textContent = "×"
		removeBtn.title = "Remove filter"
		removeBtn.onclick = () => this.handleRemoveCustomBot(botName)

		const nameLabel = document.createElement("div")
		nameLabel.className = "bot-name"
		nameLabel.textContent = botName

		const toggle = document.createElement("label")
		toggle.className = "toggle-switch"

		const checkbox = document.createElement("input")
		checkbox.type = "checkbox"
		checkbox.checked = showAll
		checkbox.onchange = e =>
			this.handleCustomBotToggle(botName, e.target.checked)

		const slider = document.createElement("span")
		slider.className = "slider"

		toggle.appendChild(checkbox)
		toggle.appendChild(slider)

		item.appendChild(removeBtn)
		item.appendChild(nameLabel)
		item.appendChild(toggle)

		return item
	}

	async handleCustomBotAllToggle(isChecked) {
		const botNames = filterState.getCustomBotNames()
		if (botNames.length === 0) {
			this.showStatus("No custom bot filters", "info")
			return
		}

		botNames.forEach(botName => {
			filterState.setCustomBot(botName, isChecked)
		})

		this.updateCustomBotUI()
		await this.applyFilters()
	}

	async handleAddCustomBots() {
		const input = document.getElementById("botNameInput")
		if (!input) return

		const rawInput = input.value.trim()
		if (!rawInput) {
			this.showStatus("Please enter bot name(s)", "error")
			return
		}

		const botNames = rawInput
			.split(",")
			.map(name => name.trim().toLowerCase())
			.filter(name => name.length > 0)

		if (botNames.length === 0) {
			this.showStatus("Please enter valid bot name(s)", "error")
			return
		}

		const state = filterState.get()
		const newBots = botNames.filter(name => !(name in state.customBots))

		if (newBots.length === 0) {
			this.showStatus("Bot(s) already filtered", "info")
			return
		}

		newBots.forEach(botName => {
			filterState.setCustomBot(botName, false)
		})

		input.value = ""
		this.updateCustomBotUI()
		await this.applyFilters()
		this.showStatus(`Added ${newBots.length} bot filter(s)`, "success")
	}

	async handleCustomBotToggle(botName, showAll) {
		try {
			filterState.setCustomBot(botName, showAll)
			this.updateCustomBotAllToggle()
			await this.applyFilters()
		} catch (error) {
			console.error("Error toggling custom bot:", error)
			this.showStatus("Error toggling bot visibility", "error")
		}
	}

	async handleRemoveCustomBot(botName) {
		try {
			filterState.removeCustomBot(botName)
			this.updateCustomBotUI()
			await this.applyFilters()
			this.showStatus(`Removed filter for ${botName}`, "success")
		} catch (error) {
			console.error("Error removing custom bot:", error)
			this.showStatus("Error removing bot filter", "error")
		}
	}

	async applyFilters() {
		if (!this.currentTabId) {
			console.error("No tab ID available")
			return
		}

		try {
			await filterState.saveToSession(this.currentTabId)
			const state = filterState.get()

			chrome.scripting.executeScript(
				{
					target: { tabId: this.currentTabId },
					function: applyVisibilityFilter,
					args: [
						state.coderabbit.visibilityState,
						state.coderabbit.showAllState,
						state.customBots,
					],
				},
				results => {
					if (chrome.runtime.lastError) {
						console.error("Error applying filter:", chrome.runtime.lastError)
						this.showStatus("Error applying filter", "error")
					}
				},
			)
		} catch (error) {
			console.error("Error in applyFilters:", error)
			this.showStatus("Error applying filters", "error")
		}
	}

	async handleSaveAsDefault() {
		const success = await filterState.saveAsDefault()
		if (success) {
			this.showStatus("Saved as default settings", "success")
		} else {
			this.showStatus("Error saving defaults", "error")
		}
	}

	showStatus(message, type) {
		try {
			const status = document.getElementById("status")
			if (!status) return

			status.textContent = message || ""
			status.className = type || ""

			if (message) {
				setTimeout(() => {
					status.textContent = ""
					status.className = ""
				}, 3000)
			}
		} catch (error) {
			console.error("Error showing status:", error)
		}
	}
}

// ============================================================================
// INITIALIZATION
// ============================================================================

const ui = new UIController()
document.addEventListener("DOMContentLoaded", () => ui.init())

// ============================================================================
// INJECTED FUNCTIONS (executed in page context)
// ============================================================================

function getAvailableSeverities() {
	try {
		const comments = document.querySelectorAll(
			'turbo-frame[id^="review-thread-or-comment-id-"]',
		)
		const severityCounts = {}

		comments.forEach(comment => {
			try {
				const authorLink = comment.querySelector(
					'a.author, a[data-hovercard-type="user"]',
				)

				if (
					authorLink &&
					authorLink.textContent.trim().toLowerCase().includes("coderabbit")
				) {
					const commentBody = comment.querySelector(".comment-body")
					if (!commentBody) return

					const allEms = commentBody.querySelectorAll("em")

					for (const em of allEms) {
						const text = em.textContent.trim()
						let severity = null

						if (text.includes("Critical")) severity = "Critical"
						else if (text.includes("Major")) severity = "Major"
						else if (text.includes("Minor")) severity = "Minor"

						if (severity) {
							severityCounts[severity] = (severityCounts[severity] || 0) + 1
							break
						}
					}
				}
			} catch (err) {
				console.error("Error processing comment:", err)
			}
		})

		return severityCounts
	} catch (error) {
		console.error("Error in getAvailableSeverities:", error)
		return {}
	}
}

function applyVisibilityFilter(
	coderabbitVisibilityState,
	coderabbitShowAllState,
	customBots,
) {
	const SELECTORS = {
		TIMELINE_ITEM: ".js-timeline-item",
		TURBO_FRAME: 'turbo-frame[id^="review-thread-or-comment-id-"]',
		INLINE_CONTAINER: ".js-inline-comments-container",
		COMMENT_BODY: ".comment-body",
		CODERABBIT_AUTHOR_LINK: 'a.author[href="/apps/coderabbitai"]',
		AUTHOR_LINK: "a.author",
		SEVERITY_EM: "em",
	}

	try {
		const allTimelineItems = document.querySelectorAll(SELECTORS.TIMELINE_ITEM)

		function getTurboFrameSeverity(turboFrame) {
			try {
				const inlineContainers = turboFrame.querySelectorAll(
					SELECTORS.INLINE_CONTAINER,
				)

				for (const inlineContainer of inlineContainers) {
					const authorLink = inlineContainer.querySelector(
						SELECTORS.CODERABBIT_AUTHOR_LINK,
					)

					if (authorLink) {
						const commentBody = inlineContainer.querySelector(
							SELECTORS.COMMENT_BODY,
						)
						if (!commentBody) continue

						const allEms = commentBody.querySelectorAll(SELECTORS.SEVERITY_EM)
						for (const em of allEms) {
							const text = em.textContent.trim()
							if (text.includes("Critical")) return "Critical"
							if (text.includes("Major")) return "Major"
							if (text.includes("Minor")) return "Minor"
						}
					}
				}
				return null
			} catch (error) {
				console.error("Error detecting turbo-frame severity:", error)
				return null
			}
		}

		function isCustomBotHidden(timelineItem) {
			if (!customBots || Object.keys(customBots).length === 0) return false

			const authorLinks = timelineItem.querySelectorAll(SELECTORS.AUTHOR_LINK)

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

		function isCodeRabbit(container) {
			return !!container.querySelector(SELECTORS.CODERABBIT_AUTHOR_LINK)
		}

		allTimelineItems.forEach(container => {
			try {
				const shouldHideCustomBot = isCustomBotHidden(container)

				if (shouldHideCustomBot) {
					container.style.display = "none"
					container.setAttribute("data-custom-bot-hidden", "true")
					return
				} else {
					container.removeAttribute("data-custom-bot-hidden")
				}

				const isCodeRabbitComment = isCodeRabbit(container)

				if (isCodeRabbitComment) {
					const turboFrames = container.querySelectorAll(SELECTORS.TURBO_FRAME)

					if (coderabbitShowAllState) {
						container.style.display = ""
						container.removeAttribute("data-coderabbit-hidden")

						turboFrames.forEach(turboFrame => {
							try {
								const severity = getTurboFrameSeverity(turboFrame)

								if (severity && coderabbitVisibilityState[severity] === false) {
									turboFrame.style.display = "none"
									turboFrame.setAttribute("data-coderabbit-hidden", "true")
								} else {
									turboFrame.style.display = ""
									turboFrame.removeAttribute("data-coderabbit-hidden")
								}
							} catch (error) {
								console.error(
									"Error processing turbo-frame in show-all mode:",
									error,
								)
							}
						})
					} else {
						container.style.display = ""
						container.removeAttribute("data-coderabbit-hidden")

						let hasVisibleTurboFrame = false

						turboFrames.forEach(turboFrame => {
							try {
								const severity = getTurboFrameSeverity(turboFrame)

								if (severity && coderabbitVisibilityState[severity] === true) {
									turboFrame.style.display = ""
									turboFrame.removeAttribute("data-coderabbit-hidden")
									hasVisibleTurboFrame = true
								} else {
									turboFrame.style.display = "none"
									turboFrame.setAttribute("data-coderabbit-hidden", "true")
								}
							} catch (error) {
								console.error(
									"Error processing turbo-frame in hide-all mode:",
									error,
								)
							}
						})

						if (!hasVisibleTurboFrame) {
							container.style.display = "none"
							container.setAttribute("data-coderabbit-hidden", "true")
						}
					}
				} else {
					container.style.display = ""
				}
			} catch (error) {
				console.error("Error processing timeline item:", error)
			}
		})
	} catch (error) {
		console.error("Error in applyVisibilityFilter:", error)
	}
}
