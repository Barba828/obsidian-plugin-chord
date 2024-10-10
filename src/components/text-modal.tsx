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

		contentEl.createEl("h1", { text: "Insert chord card" });

		new Setting(contentEl)
			.setName("Text")
			.addText((text) =>
				text
					.setValue(this.chordText)
					.setPlaceholder("Enter chord text")
					.onChange((value) => {
						this.chordText = value;
					})
			)
			.setDesc(
				"Set the chord card fixed on the text content. If set to empty, it will be a pure card."
			);

		new Setting(contentEl)
			.setName("Chord card")
			.addButton((btn) => {
				btn.setButtonText("Set chord by name").onClick(() => {
					new ChordModal(
						this.app,
						this.board,
						this.updatePreviewCard,
						this.chordOriginText
					).open();
				});
			})
			.addButton((btn) => {
				btn.setButtonText("Set chord by taps").onClick(() => {
					new ChordCustomTapsModal(
						this.app,
						this.board,
						this.updatePreviewCard,
						this.chordOriginText
					).open();
				});
			})
			.setDesc(
				"Set chord-card by chord name or finger taps on guitar board."
			);

		this.chordSetting = new Setting(contentEl)
			.setName("Card preview")
			.setDesc("Tap to clear the card preview.");
		this.updatePreviewCard(this.chordOriginText);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(() => {
					this.save();
					this.close();
				})
		);
	}

	/**
	 * 更新Setting项 展示PreviewCard
	 * @param text 
	 */
	updatePreviewCard = (text = "") => {
		this.chordSetting.clear();
		this.chordOriginText = text;

		if (text) {
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
							this.updatePreviewCard,
							this.chordOriginText
						).open()
					);
				})
				.addExtraButton((btn) =>
					btn.setIcon("trash").onClick(() => this.updatePreviewCard())
				);
		}
	};

	save = () => {
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

	/**
	 * 初始化 text 数据
	 * @param str 默认 chord str
	 */
	initText = (str?: string) => {
		// 存在默认值，从默认值获取当前chord
		if (str) {
			const { type, pointStr, title, text } = useChordText(str);			
			this.chordText = text;
			this.chordOriginText = `:${type}:${pointStr}:${title}:`;
			return;
		}
		// 默认设置 selection 为chordText
		const editor = this.app.workspace.activeEditor?.editor;
		if (editor) {
			this.chordText = editor.getSelection();
		}
	};
}
