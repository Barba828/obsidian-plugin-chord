import type { Board } from "@buitar/to-guitar";
import type { MarkdownPostProcessorContext } from "obsidian";
import { getChordWidget } from "src/decorations/utils";

export const chordCardPostProcessor = (
	element: HTMLElement,
	context: MarkdownPostProcessorContext,
	board: Board
) => {
	const codeblocks = element.findAll("code");

	for (const codeblock of codeblocks) {
		const key = codeblock.innerText.trim();
		if (key.startsWith(":chord:") && key.endsWith(":")) {
			codeblock.replaceWith(getChordWidget(key, board).toDOM());
		}
	}
};
