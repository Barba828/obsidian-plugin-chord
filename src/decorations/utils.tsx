// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { SvgChord } from "@buitar/svg-chord";
import { Board, Point } from "@buitar/to-guitar";
import { EditorView, WidgetType } from "@codemirror/view";
import { transToSvgPoints } from "src/utils/trans-svg";
import { getPointsByStr } from "src/utils";

export const chordMap = new Map<string, ChordWidget>();

/**
 * Get widget from map, if not exist, create new widget
 */
export const getChordWidget = (key: string, board: Board) => {
	let widget = chordMap.get(key);
	if (!widget) {
		widget = new ChordWidget(key, board);
		chordMap.set(key, widget);
	}
	return widget;
};

export class ChordWidget extends WidgetType {
	points: Point[];
	title: string;
	type: string;
	text: string;

	constructor(public readonly key: string, public readonly board: Board) {
		super();
		const [, type, pointStr, title, text] = key.split(":");
		this.points = getPointsByStr(pointStr, board);
		this.title = title || "";
		this.type = type;
		this.text = text;
	}

	toDOM(view?: EditorView): HTMLElement {
		const span = document.createElement("span");
		const root = createRoot(span);
		root.render(
			<span
				className={`chord-widget__wrap ${
					this.text && "chord-widget__middle"
				}`}
			>
				<SvgChord
					points={transToSvgPoints(this.points)}
					size={80}
					title={this.title}
					className="chord-widget"
				/>
				{this.text && (
					<span className="chord-widget__wrap-text">{this.text}</span>
				)}
			</span>
		);
		return span;
	}
}
