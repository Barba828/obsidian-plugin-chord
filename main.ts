import { EditorPosition, MarkdownView, Plugin } from "obsidian";
import { ChordModal } from "src/components/chord-modal";
import { ChordCustomTapsModal } from "src/components/chord-custom-taps-modal";
import { InsertTextModal } from "src/components/text-modal";
import { createInlineCodeField } from "src/decorations/chord-card-decoration";
import { chordCardPostProcessor } from "src/decorations/chord-card-processor";
import { Board } from "@buitar/to-guitar";
import { useChordText } from "src/utils";

export default class ChordCardPlugin extends Plugin {
	board: Board = new Board();
	async onload() {
		this.addCommand({
			id: "insert-chord-card",
			name: "Insert chord card",
			callback: () => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					new ChordModal(
						this.app,
						this.board,
						this.insertTextAtCursor
					).open();
					return true;
				}
			},
		});
		this.addCommand({
			id: "insert-custom-chord-card",
			name: "Insert custom chord card",
			callback: () => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					new ChordCustomTapsModal(
						this.app,
						this.board,
						this.insertTextAtCursor
					).open();
					return true;
				}
			},
		});
		this.addCommand({
			id: "insert-title-chord-card",
			name: "Insert chord card with text",
			callback: () => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					new InsertTextModal(
						this.app,
						this.board,
						this.insertTextAtCursor
					).open();
					return true;
				}
			},
		});
		/**装饰器，编辑时渲染ChordCard */
		this.registerEditorExtension([
			createInlineCodeField(this.board, (key, position) => {
				const editor = this.app.workspace.activeEditor?.editor;
				if (!editor) return;

				new InsertTextModal(
					this.app,
					this.board,
					(text) => this.insertTextAtCursor(text, position),
					key
				).open();
			}),
		]);
		/**MD后处理，渲染ChordCard */
		this.registerMarkdownPostProcessor((el, ctx) => {
			chordCardPostProcessor(el, ctx, this.board);
		});
	}

	/**
	 * 插入 code 文本
	 * @param text
	 * @returns
	 */
	insertTextAtCursor(
		text: string,
		position?: { from: EditorPosition; to?: EditorPosition }
	) {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) return;

		const from = position?.from || editor.getCursor("from");
		const to = position?.to || editor.getCursor("to");

		/** inline-code +空格 显示和弦卡片 */
		let _text = "`" + text + "` ";
		const { pointStr } = useChordText(text);
		/** 若无效和弦，插入纯文本+空格 */
		if (!pointStr) {
			_text = text + " ";
		}
		editor.replaceRange(_text, from, to);

		// Set cursor position
		const newCursorPos = {
			line: from.line,
			ch: from.ch + _text.length,
		};
		editor.setCursor(newCursorPos);
	}

	onunload() {}
}
