type Listener<E extends HTMLElement, K extends keyof HTMLElementEventMap> = (
	this: E,
	ev: HTMLElementEventMap[K],
) => unknown

function isKEvent<K extends keyof HTMLElementEventMap>(
	event: Event,
	type: K,
): event is HTMLElementEventMap[K] {
	return event.type === type
}

export function register<
	E extends HTMLElement,
	K extends keyof HTMLElementEventMap,
>(
	selectors: string,
	constructor: new () => E,
	type: K,
	listener: Listener<E, K>,
): void {
	const element = document.querySelector<E>(selectors)
	if (!element) throw new Error("Element not found", { cause: { selectors } })
	if (!(element instanceof constructor))
		throw new TypeError("Element is of incorrect type", {
			cause: { selectors, constructor },
		})

	element.addEventListener<K>(type, ev => {
		if (!isKEvent(ev, type))
			throw new Error("Event is of incorrect type", { cause: { type, ev } })

		listener.call(element, ev)
	})
}
