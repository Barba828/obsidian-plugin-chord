import type { ChordType, NoteAll, Point, Tone } from "@buitar/to-guitar";
import {
	rootToChord,
	transChordTaps,
	Board,
	chordTagMap,
	transPitch,
	NOTE_LIST,
} from "@buitar/to-guitar";
import { PageChordSetting } from "src/setting";

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
export const getChordName = (chordType: ChordType): string => {
	if (chordType.tone === undefined) {
		return "";
	}
	const note = NOTE_LIST[chordType.tone % 12];
	if (chordType.tone === chordType.over) {
		return `${note}${chordType.tag}`;
	} else {
		const over = NOTE_LIST[(chordType?.over || 0) % 12];
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

const tonalOffset: Record<PageChordSetting["mode"], number> = {
	major: 0,
	minor: 3,
};
interface ChangeKeyOption {
	key: PageChordSetting["key"];
	mode?: PageChordSetting["mode"];
	targetKey: PageChordSetting["key"];
	targetMode?: PageChordSetting["mode"];
}

/**
 * 获取调式转换的半音pitch偏移量（0-11 模12）
 * @example [C] => [A] 9
 * @example [A] => [Am] 3
 * @example [C] => [Am] 0
 */
export const getChangeKeyOffset = ({
	key,
	mode,
	targetKey,
	targetMode,
}: ChangeKeyOption) => {
	const _tonalOffset =
		tonalOffset[targetMode || "major"] - tonalOffset[mode || "major"];
	const _keyOffset =
		transPitch(targetKey as NoteAll) - transPitch(key as NoteAll);
	return (_tonalOffset + _keyOffset + 12) % 12;
};

/**
 * 转换 chordTexts 调式
 * 比如 「:chord:x-3-2-0-1-0:C:」 => 升Key 「:chord:x-x-0-2-3-2:D:」
 * @param chordTexts
 * @param board
 * @param option 调式配置
 * @returns
 */
export const transChordChangeKey = (
	chordText: string,
	board: Board,
	option: ChangeKeyOption
) => {
	// 获取调式转换半音偏移
	const pitchOffset = getChangeKeyOffset(option);

	// 1. chordText 还原为指板 point 并获取音高
	const { pointStr } = useChordText(chordText);
	const points = getPointsByStr(pointStr, board);
	// 2. 根据 pitchOffset 转换音高
	const nextTones = Array.from(
		new Set(points.map((point) => (point.tone + pitchOffset + 12) % 12))
	);
	// 3. 转换音高后，获取和弦，取该和弦的第一个 taps 指法
	const nextNotes = nextTones.map((tone) => board.notesOnC[tone]);
	const nextChordTap = transChordTaps(nextNotes)[0];

	// 4. 转换为 mdCode
	const nextText = transToMdCode(
		nextChordTap.chordTaps,
		getChordName(nextChordTap.chordType)
	);
	return nextText;
};
