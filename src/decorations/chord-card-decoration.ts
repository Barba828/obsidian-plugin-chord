import { Board } from "@buitar/to-guitar";
import { TreeCursor } from "@lezer/common";
import { syntaxTree } from "@codemirror/language";
import {
	Extension,
	RangeSetBuilder,
	StateField,
	Transaction,
} from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";
import { getChordWidget } from "src/decorations/utils";
import { EditorPosition } from "obsidian";

export const createInlineCodeField = (
	board: Board,
	onClick?: (
		key: string,
		position: { from: EditorPosition; to?: EditorPosition },
		ev?: MouseEvent
	) => void
) =>
	StateField.define<DecorationSet>({

		create(state): DecorationSet {
			return Decoration.none;
		},
		update(
			decorations: DecorationSet,
			transaction: Transaction
		): DecorationSet {
			const builder = new RangeSetBuilder<Decoration>();

			syntaxTree(transaction.state).iterate({
				enter(node: TreeCursor) {
					if (node.type.name === "inline-code") {
						const doc = transaction.state.doc;
						const from = node.from;
						const to = node.to;

						// 将偏移量转换为行和列
						const fromLine = doc.lineAt(from).number - 1; // 行号从 0 开始计数
						const fromCh = from - doc.line(fromLine + 1).from - 1;
						const toLine = doc.lineAt(to).number - 1; // 行号从 0 开始计数
						const toCh = to - doc.line(toLine + 1).from + 1;

						const key = transaction.state.doc.sliceString(from, to);
						if (key.startsWith(":chord:") && key.endsWith(":")) {
							const widget = getChordWidget(key, board, (event) =>
								onClick?.(
									key,
									{
										from: { line: fromLine, ch: fromCh },
										to: { line: toLine, ch: toCh },
									},
									event
								)
							);
							builder.add(
								node.from - 1,
								node.to + 1,
								Decoration.replace({
									widget: widget,
									inclusive: false,
								})
							);
						}
					}
				},
			});

			return builder.finish();
		},
		provide(field: StateField<DecorationSet>): Extension {
			return EditorView.decorations.from(field);
		},
	});
