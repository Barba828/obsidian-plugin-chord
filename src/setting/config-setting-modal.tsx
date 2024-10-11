import * as React from "react";
import { SvgChord } from "@buitar/svg-chord";
import { Board, DegreeType, NoteAll, scaleToDegree } from "@buitar/to-guitar";
import ChordCardPlugin from "main";
import { App, FrontMatterCache, MarkdownView, Modal, Setting } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import { PageChordSetting, ScaleChordsModal } from "src/setting";
import { getPointsByStr, useChordText, transChordChangeKey } from "src/utils";
import { transToSvgPoints } from "src/utils/trans-svg";

type ConfigSettingName = "mode" | "key" | "notes" | "chords" | "sync" | "ok";

export class ChordCardConfigModal extends Modal {
	/** 当前设置的 frontmatter */
	frontmatter: FrontMatterCache & PageChordSetting;
	/** 页面原始 frontmatter */
	originFrontmatter: FrontMatterCache & PageChordSetting;
	/** 页面原始 chords */
	originChords: string[];
	/** 是否同步修改整个页面 chords */
	isSync = false;
	_replaceChordMap: Record<string, string> = {};

	settings: Record<ConfigSettingName, Setting>;
	reactRoots: Partial<Record<ConfigSettingName, Root>> = {};

	constructor(app: App, private plugin: ChordCardPlugin) {
		super(app);
		this.originFrontmatter = {
			mode: "major",
			key: "C",
			...this.getPageFrontmatter(),
		};
		this.frontmatter = { ...this.originFrontmatter };
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", { text: "Page chord config" });

		this.settings = {
			mode: new Setting(contentEl)
				.setName("Mode")
				.setDesc("Select mode for the current page.")
				.addDropdown((dropdown) => {
					dropdown
						.addOption("major", "Major")
						.addOption("minor", "Minor")
						.setValue(this?.frontmatter?.mode || "major")
						.onChange((value) => {
							this.frontmatter.mode =
								value as PageChordSetting["mode"];
							this.renderNotesSetting();
							this.renderChordView();
						});
				}),
			key: new Setting(contentEl).setName("Key"),
			notes: new Setting(contentEl).addButton((btn) => {
				btn.setButtonText("View all diatonic chord").onClick(() => {
					new ScaleChordsModal(
						this.app,
						this.plugin.board,
						this.frontmatter
					).open();
				});
			}),
			sync: new Setting(contentEl)
				.setName("Sync chord by mode & key")
				.setDesc(
					"Synchronized modification of existing chords in the current document. And you can preview the modified chords instantly below."
				)
				.addToggle((toggle) => {
					toggle.setValue(false);
					toggle.onChange((value) => {
						this.isSync = value;
						this.renderChordView();
					});
				}),
			chords: new Setting(contentEl).setName("Page Chords"),
			ok: new Setting(contentEl).addButton((btn) => {
				btn.setButtonText("Save").setCta().onClick(this.close);
			}),
		};

		this.reactRoots = {
			key: createRoot(this.settings["key"].descEl),
			notes: createRoot(this.settings["notes"].descEl),
			chords: createRoot(this.settings["chords"].descEl),
		};

		this.reactRoots["key"]?.render(
			<KeysPickerView
				checked={this?.frontmatter?.key}
				onCheck={(value) => {
					this.frontmatter.key = value as NoteAll;
					this.renderNotesSetting();
					this.renderChordView();
				}}
			/>
		);

		this.renderNotesSetting();

		this.getPageChords().then((chords) => {
			if (!chords.length) return;
			this.originChords = chords;

			this.reactRoots["chords"]?.render(
				<ChordsView
					chords={this.originChords}
					board={this?.plugin.board}
				/>
			);
		});
	}

	/**
	 * 获取当前文档文本
	 * @returns
	 */
	getFileContent = async () => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view && view.file) {
			return await this.app.vault.read(view.file);
		}
	};

	/**
	 * 获取当前文档中所有 chord
	 * @returns chordText array
	 */
	getPageChords = async () => {
		const content = await this.getFileContent();
		const chordTextArr = content?.match(/`:chord:(.*?):`/g);
		return uniqueChordTexts(chordTextArr || []);
	};

	/**
	 * 覆盖当前文档 chordText
	 * @param chordTexts
	 */
	setPageChords = (fileContent: string) => {
		this.originChords.forEach((chordText) => {
			fileContent = fileContent?.replace(
				chordText,
				this._replaceChordMap[chordText]
			);
		});
		return fileContent;
	};

	/**
	 * 获取当前文档 frontmatter 对象
	 * @returns
	 */
	getPageFrontmatter = () => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view && view.file) {
			return {
				...this.app.metadataCache.getFileCache(view.file)?.frontmatter,
			};
		}
	};

	/**
	 * 写入当前文档 frontmatter 对象
	 * @param newData
	 * @returns
	 */
	setPageFrontmatter = (
		fileContent: string,
		newData: Record<string, unknown>
	) => {
		const _newFrontmatterStr = convertObjectToYaml({
			...this?.frontmatter,
			...newData,
		});
		const newFrontmatterStr = `---\n${_newFrontmatterStr}\n---`;

		// 使用正则表达式匹配 frontmatter 部分
		const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
		// 已存在 frontmatter ，替换文件中的 frontmatter
		if (this.getPageFrontmatter() && frontmatterMatch) {
			fileContent = fileContent.replace(
				frontmatterMatch[0],
				newFrontmatterStr
			);
		} else {
			fileContent = newFrontmatterStr + "\n" + fileContent;
		}
		return fileContent;
	};

	/**
	 * 更新Chord预览显示
	 * @param chords
	 */
	renderChordView = () => {
		let nextChords = [];
		if (this.isSync) {
			const { key: originKey, mode: originMode } =
				this.getPageFrontmatter() || {};
			nextChords = this.originChords.map((originChord) => {
				const nextChord = transChordChangeKey(
					originChord,
					this?.plugin.board,
					{
						key: originKey || "C",
						mode: originMode || "major",
						targetMode: this?.frontmatter?.mode,
						targetKey: this?.frontmatter?.key,
					}
				);
				this._replaceChordMap[originChord] = nextChord;
				return nextChord;
			});
			nextChords = uniqueChordTexts(nextChords);
		} else {
			nextChords = this.originChords;
		}

		this.reactRoots["chords"]?.render(
			<ChordsView chords={nextChords} board={this?.plugin.board} />
		);
	};

	/**
	 * 更新当前级数显示
	 */
	renderNotesSetting = () => {
		const degrees = scaleToDegree({
			mode: this.frontmatter?.mode,
			scale: this.frontmatter.key,
		});

		this.settings["notes"]?.setName(
			`${this.frontmatter?.key} ${this.frontmatter?.mode} Scale`
		);

		this.reactRoots["notes"]?.render(<DegreeNotesView degrees={degrees} />);
	};

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	close = async () => {
		let fileContent = await this.getFileContent();

		const file = this.app.workspace.getActiveViewOfType(MarkdownView)?.file;
		if (!fileContent || !file) {
			super.close();
			return;
		}

		// 1. 更新 frontmatter
		fileContent = this.setPageFrontmatter(fileContent, this.frontmatter);
		// 2. 更新 chordText
		if (this.isSync) {
			fileContent = this.setPageChords(fileContent);
		}
		await this.app.vault.modify(file, fileContent);
		super.close();
	};
}

const KeysPickerView = ({
	checked,
	onCheck,
}: {
	checked?: string;
	onCheck?: (value: string) => void;
}) => {
	const keyArr = [
		"C",
		["C#", "Db"],
		"D",
		["D#", "Eb"],
		"E",
		"F",
		["F#", "Gb"],
		"G",
		["G#", "Ab"],
		"A",
		["A#", "Bb"],
		"B",
	];
	const [_checked, setChecked] = React.useState(checked);
	React.useEffect(() => {
		setChecked(checked);
	}, [checked]);

	const checkedClass = (key: string) => {
		if (key?.trim()?.toUpperCase() === _checked?.trim()?.toUpperCase()) {
			return "mod-cta";
		}
		return "";
	};

	return (
		<>
			<div style={{ display: "flex", flexWrap: "wrap" }}>
				{keyArr.map((key, i) =>
					typeof key === "string" ? (
						<button
							key={i}
							style={{
								marginTop: "0.2rem",
								marginRight: "0.2rem",
								height: "3rem",
								width: "2rem",
								fontSize: "1.2rem",
							}}
							className={checkedClass(key)}
							onClick={() => {
								onCheck?.(key);
								setChecked(key);
							}}
						>
							{key}
						</button>
					) : (
						<div
							key={i}
							style={{
								marginTop: "0.2rem",
								marginRight: "0.2rem",
								display: "flex",
								flexDirection: "column",
								justifyContent: "space-between",
							}}
						>
							{key.map((sharpK) => (
								<button
									key={sharpK}
									style={{
										maxHeight: "1.4rem",
										width: "2rem",
									}}
									className={checkedClass(sharpK)}
									onClick={() => {
										onCheck?.(sharpK);
										setChecked(sharpK);
									}}
								>
									{sharpK}
								</button>
							))}
						</div>
					)
				)}
			</div>
			<div></div>
		</>
	);
};

const DegreeNotesView = ({ degrees }: { degrees: DegreeType[] }) => {
	return (
		<div>
			{degrees.map((degree) => (
				<button
					key={degree.note}
					style={{ marginRight: "0.2rem", marginTop: "0.2rem" }}
				>
					<div
						style={{
							fontWeight: "bold",
							fontSize: "1.2rem",
							color: "var(--text-muted)",
						}}
					>
						{degree.note}
					</div>
				</button>
			))}
		</div>
	);
};

const ChordsView = ({ chords, board }: { chords: string[]; board: Board }) => {
	return (
		<div style={{ display: "flex", flexWrap: "wrap" }}>
			{chords.map((chord) => {
				const { pointStr, title } = useChordText(chord);
				const points = getPointsByStr(pointStr, board);

				return (
					<SvgChord
						key={chord}
						points={transToSvgPoints(points)}
						size={60}
						title={title}
						color="var(--text-normal)"
						className="chord-widget"
					/>
				);
			})}
		</div>
	);
};

/**
 * chordTexts 根据 pointStr 属性去重
 * @param chordTexts
 * @returns
 */
const uniqueChordTexts = (chordTexts: string[]) => {
	/**
	 * 1. 根据 pointStr 去重
	 * 2. 移除 chordText 无效信息
	 */
	const chordMap = new Map();
	chordTexts?.forEach((chordText) => {
		const { type, pointStr, title } = useChordText(chordText);
		chordMap.set(pointStr, `:${type}:${pointStr}:${title}:`);
	});

	return Array.from(chordMap.values()) as string[];
};

/**
 * 将对象转换为 YAML 格式
 */
const convertObjectToYaml = (data: Record<string, unknown>) => {
	return Object.entries(data)
		.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
		.join("\n");
};
