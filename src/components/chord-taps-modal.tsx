// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { App, SuggestModal } from "obsidian";
import { SvgChord } from "@buitar/svg-chord";
import type { BoardChord, Point } from "@buitar/to-guitar";
import { transToSvgPoints } from "src/utils/trans-svg";

export class ChordTapsModal extends SuggestModal<BoardChord> {
	taps: BoardChord[];
	title?: string;

	/**
	 * Guitar Taps Modal
	 * @param app
	 * @param taps
	 * @param title Chord Card Title
	 */
	constructor(app: App, taps: BoardChord[], title?: string) {
		super(app);
		this.taps = taps;
		this.title = title;
		this.inputEl.disabled = true;
		this.inputEl.setAttribute("style", "visibility: hidden;");
	}

	// Returns all available suggestions.
	getSuggestions(): BoardChord[] {
		return this.taps;
	}

	// Renders each suggestion item.
	renderSuggestion(tap: BoardChord, el: HTMLElement) {
		const root = createRoot(el);
		root.render(
			<div>
				<SvgChord
					points={transToSvgPoints(tap.chordTaps)}
					size={80}
					title={this.title}
				/>
			</div>
		);
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(tap: BoardChord) {
		this.insertTextAtCursor(transToMdCode(tap.chordTaps, this.title));
	}

	insertTextAtCursor(text: string) {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) return;

		const cursorPos = editor?.getCursor();
		editor.replaceRange(text, cursorPos);
	}
}

/**
 * Point => :chord:Point:title: (string)
 * string 保存 chord 信息
 * @todo :chord: 可以自定义
 * @param points 
 * @param title 
 * @returns 
 */
const transToMdCode = (points: Point[], title?: string) => {
	const str = points
		.map((point) => `${point.string}-${point.grade}`)
		.join("|");
	let code = `:chord:${str}:`;
	if (title) {
		code = code.concat(`${title}:`);
	}

	return "`" + code + "`";
};
