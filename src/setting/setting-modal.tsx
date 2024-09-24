import ChordCardPlugin from "main";
import { App, Modal, Setting } from "obsidian";
import { useCommonSettings } from "src/setting";

export class ChordCardSettingModal extends Modal {
	chordText: string;
	chordOriginText: string;
	chordSetting: Setting;

	constructor(app: App, private plugin: ChordCardPlugin) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Chord Card Settings" });

		useCommonSettings({
			containerEl: contentEl,
			settings: this.plugin.settings,
			onChange: this.plugin.saveSettings,
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
