// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { App, SuggestModal } from "obsidian";
import { SvgChord } from "@buitar/svg-chord";
import type { BoardChord } from "@buitar/to-guitar";
import { transToSvgPoints } from "src/utils/trans-svg";
import { transToMdCode } from "src/utils";

export class ChordTapsModal extends SuggestModal<BoardChord> {
	/**
	 * Guitar Taps Modal
	 * @param app
	 * @param taps
	 * @param title Chord Card Title
	 */
	constructor(
		app: App,
		private taps: BoardChord[],
		private title?: string,
		private onChooseTapText?: (text: string) => void
	) {
		super(app);
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
			<div className="horizontal-flex">
				<SvgChord
					points={transToSvgPoints(tap.chordTaps)}
					size={80}
					title={this.title}
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
		const insertText = transToMdCode(tap.chordTaps, this.title)
		this.onChooseTapText?.(insertText);
	}
}
