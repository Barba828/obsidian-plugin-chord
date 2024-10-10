// @ts-ignore
import React from "react";
import { createRoot } from "react-dom/client";
import { SvgChord } from "@buitar/svg-chord";
import { Board, Point } from "@buitar/to-guitar";
import { EditorView, WidgetType } from "@codemirror/view";
import { transToSvgPoints } from "src/utils/trans-svg";
import { getPointsByStr, useChordText } from "src/utils";
import {
	ChordCardDisplayMode,
	ChordCardPluginSettings,
	ChordCardSize,
} from "src/setting";

export const chordMap = new Map<string, ChordWidget>();

interface ChordWidgetProps {
	key: string;
	board: Board;
	onClick?: (ev: MouseEvent) => void;
	options?: Pick<ChordCardPluginSettings, "displayMode" | "size">;
}

/**
 * Get widget from map, if not exist, create new widget
 */
export const getChordWidget = ({
	key,
	board,
	onClick,
	options,
}: ChordWidgetProps) => {
	let widget = chordMap.get(key);
	if (!widget) {
		widget = new ChordWidget(key, board, onClick, options);
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
		public readonly onClick?: (ev: MouseEvent) => void,
		public readonly options?: Pick<
			ChordCardPluginSettings,
			"displayMode" | "size"
		>
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
		const size = sizeMap[this.options?.size || ChordCardSize.Medium];
		root.render(
			<span className={`chord-widget__wrap`}>
				{this.options?.displayMode === ChordCardDisplayMode.Text ? (
					<>
						<SvgChord
							points={transToSvgPoints(this.points)}
							size={size}
							title={this.title}
							color="var(--text-normal)"
							className="chord-widget chord-widget__wrap-fixed"
						/>
						<div className="chord-widget__wrap-title">
							{this.title}
						</div>
					</>
				) : this.options?.displayMode === ChordCardDisplayMode.Fixed ? (
					<>
						<SvgChord
							points={transToSvgPoints(this.points)}
							size={size}
							title={this.title}
							color="var(--text-normal)"
							className="chord-widget chord-widget__wrap-fixed"
						/>
						{!this.text && (
							<span className="chord-widget__wrap-text">
								{this.title}
							</span>
						)}
					</>
				) : (
					<SvgChord
						points={transToSvgPoints(this.points)}
						size={size}
						title={this.title}
						color="var(--text-normal)"
						className="chord-widget"
					/>
				)}
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

const sizeMap = {
	[ChordCardSize.Small]: 60,
	[ChordCardSize.Medium]: 80,
	[ChordCardSize.Large]: 120,
};
