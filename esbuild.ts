import * as esbuild from "esbuild"

await esbuild.build({
	banner: {
		js: `// Copyright 2026 CodeRabbit

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.`,
	},
	bundle: true,
	entryPoints: ["src/popup.css", "src/popup.html", "src/popup.ts"],
	footer: { js: "// © 2026 CodeRabbit" },
	format: "esm",
	loader: {
		".css": "copy",
		".html": "copy",
		".template.html": "text",
		".ts": "ts",
	},
	minify: false,
	outdir: "out",
	sourcemap: true,
	splitting: true,
	treeShaking: true,
})
