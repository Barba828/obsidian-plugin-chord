import type { Board } from "@buitar/to-guitar";
import type { MarkdownPostProcessorContext } from "obsidian";
import { getChordWidget } from "src/decorations/utils";
import { ChordCardPluginSettings } from "src/setting";

interface ChordCardPostProcessorParams {
	element: HTMLElement;
	context: MarkdownPostProcessorContext;
	board: Board;
	options: Partial<ChordCardPluginSettings>;
}

export const chordCardPostProcessor = ({
	element,
	board,
	options,
}: ChordCardPostProcessorParams) => {
	if (!options.renderCode) return;
	
	const codeblocks = element.findAll("code");
	for (const codeblock of codeblocks) {
		const key = codeblock.innerText.trim();
		if (key.startsWith(":chord:") && key.endsWith(":")) {
			codeblock.replaceWith(getChordWidget({ key, board }).toDOM());
		}
	}
};
