// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { SvgChord } from "@buitar/svg-chord";
import { Board, Point } from "@buitar/to-guitar";
import { EditorView, WidgetType } from "@codemirror/view";
import { transToSvgPoints } from "src/utils/trans-svg";
import { getPointsByStr, useChordText } from "src/utils";

export const chordMap = new Map<string, ChordWidget>();

/**
 * Get widget from map, if not exist, create new widget
 */
export const getChordWidget = (
	key: string,
	board: Board,
	onClick?: (ev: MouseEvent) => void
) => {
	let widget = chordMap.get(key);
	if (!widget) {
		widget = new ChordWidget(key, board, onClick);
		chordMap.set(key, widget);
	}
	return widget;
};

export class ChordWidget extends WidgetType {
	points: Point[];
	title: string;
	type: string;
	text: string;

	constructor(
		public readonly key: string,
		public readonly board: Board,
		public readonly onClick?: (ev: MouseEvent) => void
	) {
		super();
		const { type, pointStr, title, text } = useChordText(key);
		this.points = getPointsByStr(pointStr, board);
		this.title = title || "";
		this.type = type;
		this.text = text;
	}

	toDOM(view?: EditorView): HTMLElement {
		const span = document.createElement("span");
		const root = createRoot(span);
		root.render(
			<span className={`chord-widget__wrap`}>
				<SvgChord
					points={transToSvgPoints(this.points)}
					size={80}
					title={this.title}
					color="var(--text-normal)"
					className="chord-widget"
				/>
				{this.text && (
					<span className="chord-widget__wrap-text">{this.text}</span>
				)}
			</span>
		);
		if (this.onClick) {
			span.onclick = this.onClick;
		}
		return span;
	}
}
