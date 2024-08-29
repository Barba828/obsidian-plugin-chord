// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { App, SuggestModal } from "obsidian";
import { SvgChord } from "@buitar/svg-chord";
import { pitchToChordType, Board, type BoardChord } from "@buitar/to-guitar";
import { transToMdCode, getPointsByStr, getChordName } from "src/utils";
import { transToSvgPoints } from "src/utils/trans-svg";

export class ChordCustomTapsModal extends SuggestModal<BoardChord> {
	board: Board;

	/**
	 * Guitar Taps Modal
	 * @param app
	 * @param board
	 */
	constructor(app: App, board?: Board) {
		super(app);
		this.setPlaceholder(
			"Enter the finger position, for example 'x32010' for C chord"
		);
		this.board = board || new Board();
	}

	// Returns all available suggestions.
	getSuggestions(query: string): BoardChord[] {
		const chordTaps = getPointsByStr(query, this.board);
		const chordTypes = pitchToChordType(
			Array.from(new Set(chordTaps.map((tap) => tap.tone)))
		);

		// 无效和弦
		if (!chordTypes.length) {
			return [
				{
					chordTaps,
					chordType: {
						name: "--",
						name_zh: "--",
						tag: "",
					},
				},
			];
		}

		// 同一taps 也许有转位和弦等多个名称
		return chordTypes.map(
			(chordType) =>
				({
					chordTaps,
					chordType,
				} as BoardChord)
		);
	}

	// Renders each suggestion item.
	renderSuggestion(tap: BoardChord, el: HTMLElement) {
		const root = createRoot(el);
		root.render(
			<div className="horizontal-flex">
				<SvgChord
					points={transToSvgPoints(tap.chordTaps)}
					size={80}
					title={getChordName(tap.chordType, this.board)}
				/>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "6px",
						alignItems: "flex-end",
					}}
				>
					<div
						className="chord-modal-list__item__sub-title"
						style={{ fontSize: "1rem", fontWeight: "bold" }}
					>
						{(tap.chordType.name.charAt(0) || "").toUpperCase() +
							tap.chordType.name.slice(1)}
					</div>
					<div className="chord-modal-list__item__right">
						{tap.chordTaps.map((tap) => (
							<div
								className="chord-modal-list__item__right-interval"
								key={tap.index}
							>
								{tap.note}
								<span
									style={{ fontSize: "0.6rem", opacity: 0.6 }}
								>
									{tap.level}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(tap: BoardChord) {
		this.insertTextAtCursor(
			transToMdCode(
				tap.chordTaps,
				getChordName(tap.chordType, this.board)
			)
		);
	}

	insertTextAtCursor(text: string) {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) return;

		// Insert text
		const cursorPos = editor?.getCursor();
		editor.replaceRange(text, cursorPos, cursorPos);

		// Set cursor position
		const newCursorPos = {
			line: cursorPos.line,
			ch: cursorPos.ch + text.length,
		};
		editor.setCursor(newCursorPos);
	}
}
