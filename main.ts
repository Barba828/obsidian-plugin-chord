import { EditorPosition, MarkdownView, Plugin } from "obsidian";
import { ChordModal } from "src/components/chord-modal";
import { ChordCustomTapsModal } from "src/components/chord-custom-taps-modal";
import { InsertTextModal } from "src/components/text-modal";
import { createInlineCodeField } from "src/decorations/chord-card-decoration";
import { chordCardPostProcessor } from "src/decorations/chord-card-processor";
import { Board } from "@buitar/to-guitar";
import { useChordText } from "src/utils";
import {
	type ChordCardPluginSettings,
	DEFAULT_SETTINGS,
	ChordCardPluginTab,
	ChordCardSettingModal,
	ChordCardConfigModal,
} from "src/setting";

export default class ChordCardPlugin extends Plugin {
	board: Board = new Board();
	settings: ChordCardPluginSettings;
	actions: Record<string, HTMLElement> = {};

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new ChordCardPluginTab(this.app, this));

		this.initCommands();
		this.initRenderExtension();
		this.initActions();
	}

	/**初始化 chord-card 命令*/
	initCommands = () => {
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
	};

	/**初始化 chord-card 渲染方法*/
	initRenderExtension = () => {
		/**装饰器，编辑时渲染ChordCard */
		this.registerEditorExtension([
			createInlineCodeField({
				board: this.board,
				options: this.settings,
				onClick: (key, position) => {
					const editor = this.app.workspace.activeEditor?.editor;
					if (!editor) return;

					new InsertTextModal(
						this.app,
						this.board,
						(text) => this.insertTextAtCursor(text, position),
						key
					).open();
				},
			}),
		]);
		/**MD后处理，渲染ChordCard */
		this.registerMarkdownPostProcessor((el, ctx) => {
			chordCardPostProcessor({
				element: el,
				context: ctx,
				board: this.board,
				options: this.settings,
			});
		});
	};

	/**初始化 chord-card 右上角actions*/
	initActions = () => {
		// onLayoutReady 确保有 activeView
		this.app.workspace.onLayoutReady(() => {
			const activeView =
				this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView) {
				return;
			}

			this.actions["open-settings"] = activeView.addAction(
				"settings-2",
				"Chord card settings",
				() => {
					new ChordCardSettingModal(this.app, this).open();
				}
			);
			this.actions["open-config"] = activeView.addAction(
				"file-edit",
				"Page chord config",
				() => {
					new ChordCardConfigModal(this.app, this).open();
				}
			);
			this.actions["open-render"] = activeView.addAction(
				"eye",
				"Chord card preview",
				() => {
					this.settings.renderCode = false;
					this.saveSettings();
				}
			);
			this.actions["close-render"] = activeView.addAction(
				"eye-off",
				"Chord card preview",
				() => {
					this.settings.renderCode = true;
					this.saveSettings();
				}
			);

			// 初始化时 更新 icons 状态
			this.refreshActionIcons();

			// 监听页面变化时 更新 icons 状态
			this.registerEvent(
				this.app.workspace.on(
					"active-leaf-change",
					this.refreshActionIcons
				)
			);
		});
	};

	/**
	 * 插入 code 文本
	 * @param text
	 * @returns
	 */
	insertTextAtCursor = (
		text: string,
		position?: { from: EditorPosition; to?: EditorPosition }
	) => {
		const editor = this.app.workspace.activeEditor?.editor;
		if (!editor) return;

		const from = position?.from || editor.getCursor("from");
		const to = position?.to || editor.getCursor("to");

		/** inline-code + 空格 显示和弦卡片 */
		let _text = "`" + text + "` ";
		const { pointStr } = useChordText(text);
		/** 若无效和弦，插入纯文本 + 空格 */
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
	};

	/**
	 * 判断当前 View 是否存在 chord-card
	 * @returns
	 */
	hasChordCard = () => {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		return activeView && activeView.editor.getValue().includes(":chord:");
	};

	loadSettings = async () => {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	};

	saveSettings = async () => {
		await this.saveData(this.settings);
		this.refreshCurrentDocument();
		this.refreshActionIcons();
	};

	/**
	 * 刷新当前文档
	 * 更新设置后需要重新渲染 Chordcard
	 */
	refreshCurrentDocument() {
		// preview 模式重渲染
		this.app.workspace
			.getActiveViewOfType(MarkdownView)
			?.previewMode.rerender(true);

		// editor 模式触发页面刷新
		const editor =
			this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		if (editor) {
			editor.focus();
			// 强制改变文档内容然后恢复（触发重新渲染）
			editor.setValue(editor.getValue());
			// 刷新编辑器视图
			editor.refresh();
			editor.blur()
		}
	}

	/**
	 * 刷新当前action icon显示
	 */
	refreshActionIcons = () => {
		const hasChord = this.hasChordCard();
		if (!hasChord) {
			Object.values(this.actions).forEach((action) => {
				action.setCssStyles({ display: "none" });
			});
			return;
		}

		this.actions["open-settings"].setCssStyles({ display: "block" });
		this.actions["open-config"].setCssStyles({ display: "block" });
		this.actions["open-render"].setCssStyles({
			display: this.settings.renderCode ? "block" : "none",
		});
		this.actions["close-render"].setCssStyles({
			display: this.settings.renderCode ? "none" : "block",
		});
	};

	onunload() {}
}
