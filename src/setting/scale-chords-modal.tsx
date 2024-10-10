import * as React from "react";
import { App, Modal } from "obsidian";
import { PageChordSetting } from "src/setting";
import {
	Board,
	NoteAll,
	scaleToDegreeWithChord,
	scaleToDegree,
	ChordDegreeNum,
	transChordTaps,
	Tone,
	DegreeChord,
} from "@buitar/to-guitar";
import { createRoot, Root } from "react-dom/client";
import { getChordName } from "src/utils";
import { SvgChord } from "@buitar/svg-chord";
import { transToSvgPoints } from "src/utils/trans-svg";

export class ScaleChordsModal extends Modal {
	chordRoot: Root;

	constructor(
		app: App,
		private board: Board,
		private options: PageChordSetting
	) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", {
			text: `${this.options.key}-${this.options.mode} diatonic chords`,
		});

		const chordEl = this.contentEl.createEl("div");
		this.chordRoot = createRoot(chordEl);
		this.chordRoot.render(
			<ScaleChordsView options={this.options} board={this.board} />
		);
	}
}

const chordTypeArr = [
	{
		type: 3,
		text: "Triad",
		intro: "A triad chord is a basic type of chord consisting of three distinct pitches: the root, the third, and the fifth. These notes are stacked in intervals of thirds. Triads are the foundation of most harmonies in Western music.",
	},
	{
		type: 7,
		text: "Seventh",
		intro: "A seventh chord is an extension of a triad chord, consisting of four notes: the root, third, fifth, and a seventh. The addition of the seventh note gives the chord a richer and more complex sound. Seventh chords are fundamental in many musical styles, especially jazz, classical, and pop music.",
	},
	{
		type: 9,
		text: "Ninth",
		intro: "A ninth chord is an extension of a seventh chord, consisting of five notes: the root, third, fifth, seventh, and ninth. The addition of the ninth gives the chord a richer, more colorful sound and is commonly used in jazz, blues, and pop music. Ninth chords can be built on different types of seventh chords, leading to several variations based on the quality of the seventh and the ninth (major or minor).",
	},
];

const ScaleChordsView = ({
	options,
	board,
}: {
	options: PageChordSetting;
	board: Board;
}) => {
	const [chordType, setchordType] = React.useState(chordTypeArr[0]);

	const params = {
		mode: options.mode,
		scale: options.key as NoteAll,
	};

	/** 获取级数 */
	const degrees = scaleToDegree(params);
	/** 获取级数和弦 */
	const chords = React.useMemo(() => {
		return scaleToDegreeWithChord({
			...params,
			chordNumType: chordType.type as ChordDegreeNum,
			degrees,
		});
	}, [chordType]);

	/**和弦类型选择Tab */
	const TypeChecker = () => (
		<div style={{ marginBottom: "0.4rem" }}>
			{chordTypeArr.map((_chordType) => (
				<button
					key={_chordType.type}
					style={{ marginRight: "0.4rem" }}
					className={_chordType === chordType ? "mod-cta" : ""}
					onClick={() => setchordType(_chordType)}
				>
					<div style={{ fontWeight: "bold" }}>{_chordType.text}</div>
				</button>
			))}
		</div>
	);

	return (
		<div>
			<TypeChecker />
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					padding: "0.4rem",
					borderRadius: "4px",
					backgroundColor: "var(--background-secondary)",
				}}
			>
				{chords.map((chord) => (
					<ScaleChordItem chord={chord} />
				))}
			</div>
		</div>
	);
};

const ScaleChordItem = ({ chord }: { chord: DegreeChord }) => {
	/**当前chord的所有指法taps */
	const taps = React.useMemo(() => {
		return transChordTaps(chord.chord.map((item) => item.note) as Tone[]);
	}, [chord]);

	return (
		<div
			style={{
				width: "100%",
				display: "flex",
				marginBottom: "0.2rem",
			}}
			key={chord.note}
		>
			<button
				className="mod-cta"
				key={chord.note}
				style={{
					height: "48px",
					marginRight: "0.2rem",
					width: "4rem",
					fontWeight: "bold",
					flexDirection: "column",
				}}
			>
				<div>{getChordName(chord.chordType[0])}</div>
				<div
					style={{
						fontSize: "0.5rem",
						fontWeight: "lighter",
						opacity: 0.6,
					}}
				>
					{chord.scale}
				</div>
			</button>
			<div
				style={{ display: "flex", flex: 1 }}
				className="scroll-without-bar"
			>
				{taps.map((tap, index) => (
					<button
						key={index}
						style={{
							height: "48px",
							marginRight: "0.2rem",
						}}
					>
						<SvgChord
							points={transToSvgPoints(tap.chordTaps)}
							size={40}
							title={getChordName(tap.chordType)}
						></SvgChord>
					</button>
				))}
			</div>
		</div>
	);
};
