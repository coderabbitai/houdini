console.log("Hello, world!")

import browser from "webextension-polyfill"
const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
console.log("tab", tab)
