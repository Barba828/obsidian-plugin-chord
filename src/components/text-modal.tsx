import { App, Modal, Setting } from "obsidian";
import { ChordModal } from "src/components/chord-modal";
import { ChordCustomTapsModal } from "src/components/chord-custom-taps-modal";
import { Board } from "@buitar/to-guitar";
import { ChordWidget } from "src/decorations/utils";
import { useChordText } from "src/utils";

export class InsertTextModal extends Modal {
	chordText: string;
	chordOriginText: string;
	chordSetting: Setting;

	constructor(
		app: App,
		private board: Board,
		public onChooseTapText?: (text: string) => void,
		defaultText?: string
	) {
		super(app);
		this.initText(defaultText);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Insert Chord Card" });

		new Setting(contentEl).setName("Text").addText((text) =>
			text
				.setValue(this.chordText)
				.setPlaceholder("Enter chord text")
				.onChange((value) => {
					this.chordText = value;
				})
		);

		this.chordSetting = new Setting(contentEl).setName("Chord");
		this.updateSettings(this.chordOriginText);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSave();
				})
		);
	}

	updateSettings = (text = "") => {
		this.chordSetting.clear();
		this.chordOriginText = text;

		if (text) {
			/**
			 * 使用 Setting Button 显示 ChordCard
			 */
			this.chordSetting
				.addButton((btn) => {
					const chordCardDom = new ChordWidget(
						this.chordOriginText,
						this.board
					).toDOM();
					btn.buttonEl.appendChild(chordCardDom);
					btn.setClass("chord-card-setting-btn").onClick(() =>
						new ChordCustomTapsModal(
							this.app,
							this.board,
							this.updateSettings,
							this.chordOriginText
						).open()
					);
				})
				.addButton((btn) =>
					btn
						.setButtonText("Clean")
						.onClick(() => this.updateSettings())
				);
		} else {
			/**
			 * 使用 Setting Button 显示 Add Chord 和 Add Custom Chord 入口
			 */
			this.chordSetting.addButton((btn) => {
				btn.setButtonText("Add Chord").onClick(() => {
					new ChordModal(
						this.app,
						this.board,
						this.updateSettings
					).open();
				});
			});
			this.chordSetting.addButton((btn) => {
				btn.setButtonText("Add Custom Chord").onClick(() => {
					new ChordCustomTapsModal(
						this.app,
						this.board,
						this.updateSettings
					).open();
				});
			});
		}
	};

	onSave = () => {
		if (!this.chordOriginText) {
			this.onChooseTapText?.(this.chordText);
			return;
		}
		if (!this.chordText) {
			this.onChooseTapText?.(this.chordOriginText);
			return;
		}
		this.onChooseTapText?.(`${this.chordOriginText}${this.chordText}:`);
	};

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	initText = (str?: string) => {
		if (!str) return;
		const { type, pointStr, title, text } = useChordText(str);
		this.chordText = text;
		this.chordOriginText = `:${type}:${pointStr}:${title}:`;
	};
}
