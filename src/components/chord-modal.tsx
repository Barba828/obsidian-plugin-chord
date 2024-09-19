import { App, SuggestModal } from "obsidian";
import {
	getChordListByStr,
	getTapsByChordItem,
	useChordText,
	type ChordListItem,
} from "src/utils";
import { ChordTapsModal } from "src/components/chord-taps-modal";
import { Board } from "@buitar/to-guitar";

export class ChordModal extends SuggestModal<ChordListItem> {
	constructor(
		app: App,
		private board: Board,
		public onChooseTapText?: (text: string) => void,
		public defaultSearch?: string
	) {
		super(app);
		this.setPlaceholder("Enter chord name, like 'Am7'");
		this.emptyStateText = "No chords.";
	}

	onOpen() {
		super.onOpen();
		if (this.defaultSearch) {
			const { title } = useChordText(this.defaultSearch);
			// 设置默认搜索值
			this.inputEl.value = title;
			// 触发输入事件以更新建议列表
			this.inputEl.dispatchEvent(new Event("input"));
		}
	}

	// Returns all available suggestions.
	getSuggestions(query: string): ChordListItem[] {
		return getChordListByStr(query);
	}

	// Renders each suggestion item.
	renderSuggestion(chordItem: ChordListItem, el: HTMLElement) {
		el.addClass("chord-modal-list__item");

		// left content
		const left = el.createDiv();
		left.createEl("div", {
			text: chordItem.note + chordItem.tag,
			cls: "chord-modal-list__item__title",
		});
		left.createEl("small", {
			text:
				(chordItem?.chord?.name?.charAt(0) || "").toUpperCase() +
				chordItem?.chord?.name?.slice(1),
			cls: "chord-modal-list__item__sub-title",
		});

		// right content
		const right = el.createDiv({ cls: "chord-modal-list__item__right" });
		chordItem.chord?.constitute?.forEach((interval) => {
			right.createDiv({
				cls: "chord-modal-list__item__right-interval",
				text: interval + "",
			});
		});
	}

	// Perform action on the selected suggestion.
	onChooseSuggestion(chordItem: ChordListItem) {
		const taps = getTapsByChordItem(chordItem, this.board);
		const title = chordItem.note + chordItem.tag;
		new ChordTapsModal(this.app, taps, title, this.onChooseTapText).open();
	}
}
