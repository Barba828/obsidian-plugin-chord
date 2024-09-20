import type { ChordType, Point, Tone } from "@buitar/to-guitar";
import {
	rootToChord,
	transChordTaps,
	Board,
	chordTagMap,
} from "@buitar/to-guitar";

const tags = Array.from(chordTagMap.keys());

export interface ChordListItem {
	note: string;
	tag: string;
	chord?: Partial<ChordType>;
}

/**
 * 根据搜索文本获取推荐和弦名称（note + tag）列表
 * @param search
 * @returns
 */
export const getChordListByStr = (search: string): ChordListItem[] => {
	if (!search) {
		return ["C", "D", "E", "F", "G", "A", "B"].map((n) => ({
			note: n,
			tag: "",
			chord: chordTagMap.get(""),
		}));
	}
	if (
		!["C", "D", "E", "F", "G", "A", "B"].includes(
			search[0].toLocaleUpperCase()
		)
	) {
		return [];
	}
	if (search.length === 1) {
		return ["", "b", "#", ...tags.slice(1)].map((t) => ({
			note: search[0],
			tag: t,
			chord: chordTagMap.get(t) || chordTagMap.get(""), // "b", "#" 不存在chord，使用默认三和弦
		}));
	}

	const { note, tag } = getNoteAndTag(search);
	return tags
		.filter((t) => t.includes(tag))
		.map((t) => ({
			note,
			tag: t,
			chord: chordTagMap.get(t),
		}));
};

/**
 * 根据str获取note和tag
 * @param str
 */
export const getNoteAndTag = (str: string) => {
	if (!str.length) {
		throw Error("chord name is empty");
	}
	let note = str[0].toLocaleUpperCase(),
		tag = str.slice(1);

	if (["b", "#"].includes(str[1])) {
		note = note + str[1];
		tag = str.slice(2);
	}

	return {
		note,
		tag,
	};
};

/**
 * 根据和弦名称获取taps列表
 * @param chordItem
 * @returns
 */
export const getTapsByChordItem = (chordItem: ChordListItem, board: Board) => {
	if (!chordItem.chord) {
		return [];
	}
	const { note, tag } = chordItem;
	const { chord } = rootToChord(note as Tone, tag);
	if (!chord) {
		return [];
	}
	const chordTones = chord.map((pitch) => board.notes[pitch % 12] as Tone);
	return transChordTaps(chordTones, board);
};

/**
 * 字符串转换为point
 * 例如:str = "x-3-2-0-1-0"，=> board.keyboard C 和弦
 * @transToMdCode 函数的逆操作
 * @param str
 * @param board
 * @returns
 */
export const getPointsByStr = (str: string, board: Board) => {
	// 仅允许匹配 0-9xX-，比如C和弦「x32010」[x-x-x-11-10-12]
	if (!/^[0-9xX-]+$/i.test(str)) {
		return [];
	}

	const frets = str.includes("-") ? str.split("-") : str.split("");

	return frets
		.slice(0, 6)
		.map((grade, index) => {
			if (isNaN(Number(grade))) {
				return null;
			}
			return board.keyboard[index][Number(grade)];
		})
		.filter((point) => point !== null) as Point[];
};

/**
 * Point => :chord:Point:title: (string) string 保存 chord 信息
 * @getPointsByStr 函数的逆操作
 * @todo :chord: 文本可以自定义
 * @param points
 * @param title
 * @returns
 */
export const transToMdCode = (points: Point[], title?: string) => {
	const tapArr = ["x", "x", "x", "x", "x", "x"]; // 六根弦
	points.forEach((point) => (tapArr[point.string - 1] = String(point.grade)));
	let code = `:chord:${tapArr.join("-")}:`;
	if (title) {
		code = code.concat(`${title}:`);
	}
	return code;
};

/**
 * chordType => chordName
 * @param chordType
 * @param board
 * @returns
 */
export const getChordName = (chordType: ChordType, board: Board): string => {
	if (chordType.tone === undefined) {
		return "";
	}
	const note = board.notes[chordType.tone % 12];
	if (chordType.tone === chordType.over) {
		return `${note}${chordType.tag}`;
	} else {
		const over = board.notes[(chordType?.over || 0) % 12];
		return `${over}${chordType.tag}/${note}`;
	}
};

/**
 * 从key中解析和弦 type、pointStr、title、text
 * @param key
 * @returns
 */
export const useChordText = (key: string) => {
	const [, type = "chord", pointStr = "", title = "", text = ""] =
		key.split(":");
	return {
		type,
		pointStr,
		title,
		text,
	};
};
