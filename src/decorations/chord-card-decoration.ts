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

export const createInlineCodeField = (board: Board) =>
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
						const key = transaction.state.doc.sliceString(
							node.from,
							node.to
						);
						if (key.startsWith(":chord:") && key.endsWith(":")) {
							builder.add(
								node.from - 1,
								node.to + 1,
								Decoration.replace({
									widget: getChordWidget(key, board),
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
