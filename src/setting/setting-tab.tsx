import ChordCardPlugin from "main";
import { useCommonSettings } from "src/setting";
import { App, PluginSettingTab } from "obsidian";

export class ChordCardPluginTab extends PluginSettingTab {
	constructor(app: App, private plugin: ChordCardPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		useCommonSettings({
			containerEl,
			settings: this.plugin.settings,
			onChange: this.plugin.saveSettings,
		});
	}
}
