export enum ChordCardSize {
	Small = 'small',
	Medium = 'medium',
	Large = 'large',
}

export enum ChordCardDisplayMode {
	DEFAULT = '',
	TEXT = 'text',
	FIXED = 'fixed',
	// CODE = 3, // close renderCode
}

export interface ChordCardPluginSettings {
	size: ChordCardSize;
	displayMode: ChordCardDisplayMode;
    renderCode: boolean;
}
