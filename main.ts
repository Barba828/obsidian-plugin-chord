import { MarkdownView, Plugin } from "obsidian";
import { ChordModal } from "src/components/chord-modal";
import { createInlineCodeField } from "src/decorations/chord-card-decoration";
import { chordCardPostProcessor } from "src/decorations/chord-card-processor";
import { Board } from "@buitar/to-guitar";

export default class ChordCardPlugin extends Plugin {
	board: Board = new Board();
	async onload() {
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "insert-chord-card",
			name: "Insert chord card",
			callback: () => {
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					new ChordModal(this.app, this.board).open();
					return true;
				}
			},
		});
		/**装饰器，编辑时渲染ChordCard */
		this.registerEditorExtension([createInlineCodeField(this.board)]);
		/**MD后处理，渲染ChordCard */
		this.registerMarkdownPostProcessor((el, ctx) => {
			chordCardPostProcessor(el, ctx, this.board);
		});
	}

	onunload() {}
}
