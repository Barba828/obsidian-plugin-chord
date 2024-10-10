import { Setting } from "obsidian";
import {
	ChordCardDisplayMode,
	ChordCardPluginSettings,
	ChordCardSize,
} from "src/setting";

export const useCommonSettings = ({
	containerEl,
	settings,
	onChange,
}: {
	containerEl: HTMLElement;
	settings: ChordCardPluginSettings;
	onChange: (
		key: keyof ChordCardPluginSettings,
		value: ChordCardPluginSettings[keyof ChordCardPluginSettings]
	) => void;
}) => {
	const settingsEl: Partial<{
		[K in keyof ChordCardPluginSettings]: Setting;
	}> = {};

	settingsEl.renderCode = new Setting(containerEl)
		.setName("Open render card")
		.setDesc("Enable or disable the chord code rendering.")
		.addToggle((toggle) => {
			toggle
				.setValue(settings.renderCode) // 初始值
				.onChange(async (value) => {
					settings.renderCode = value;
					settingsEl.size?.setDisabled?.(!value);
					settingsEl.displayMode?.setDisabled?.(!value);
					onChange?.("renderCode", value);
				});
		});

	settingsEl.size = new Setting(containerEl)
		.setName("Chord card size")
		.setDesc("Select the size of the chord card.")
		.addDropdown((dropdown) => {
			dropdown
				.addOption(ChordCardSize.Small, "Small")
				.addOption(ChordCardSize.Medium, "Medium")
				.addOption(ChordCardSize.Large, "Large")
				.setValue(settings.size)
				.onChange((value: ChordCardSize) => {
					settings.size = value;
					onChange?.("size", value);
				});
		})
		.setDisabled(!settings.renderCode);

	settingsEl.displayMode = new Setting(containerEl)
		.setName("Chord card display mode")
		.setDesc("Select the display mode for the chord card.")
		.addDropdown((dropdown) => {
			dropdown
				.addOption(ChordCardDisplayMode.Default, "Default")
				.addOption(ChordCardDisplayMode.Text, "Text")
				.addOption(ChordCardDisplayMode.Fixed, "Fixed")
				.setValue(settings.displayMode)
				.onChange((value: ChordCardDisplayMode) => {
					settings.displayMode = value;
					onChange?.("size", value);
				});
		})
		.setDisabled(!settings.renderCode);

    return settingsEl;
};
