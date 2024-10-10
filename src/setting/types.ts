import { ModeType, NoteAll } from "@buitar/to-guitar";

/**
 * Render card size (width * height)
 */
export enum ChordCardSize {
	Small = "small",
	Medium = "medium",
	Large = "large",
}

export enum ChordCardDisplayMode {
	Default = "",
	Text = "text",
	Fixed = "fixed",
	// CODE = 3, // close renderCode
}

export interface ChordCardPluginSettings {
	size: ChordCardSize;
	displayMode: ChordCardDisplayMode;
	renderCode: boolean;
}

export type PageChordSetting = {
	key: NoteAll;
	mode: Extract<ModeType, 'major' | 'minor'>;
}