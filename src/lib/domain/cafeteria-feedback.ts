const EXCLUDED_MENU_PATTERNS = [
	/^(?:쌀|잡곡|흑미|현미|보리)?밥$/,
	/김치$/,
	/깍두기$/,
	/단무지$/,
	/나물$/,
	/샐러드$/,
	/음료$/,
	/후식$/,
	/소스$/
];

const VOTABLE_MENU_PATTERNS = [
	/국$/,
	/찌개$/,
	/탕$/,
	/덮밥$/,
	/비빔밥$/,
	/볶음밥$/,
	/카레$/,
	/돈까스$/,
	/제육/,
	/불고기/,
	/닭갈비/,
	/치킨/,
	/파스타/,
	/면$/,
	/볶음$/,
	/구이$/,
	/조림$/,
	/튀김$/,
	/전$/
];

export type CafeteriaMealSlot = 'breakfast' | 'lunch' | 'dinner';

const VOTE_OPENING_TIMES: Record<CafeteriaMealSlot, string> = {
	breakfast: '08:00',
	lunch: '11:30',
	dinner: '17:00'
};

export function normalizeMenuName(menuName: string) {
	return menuName.normalize('NFKC').trim().replace(/\s+/g, ' ');
}

export function isVotableMenu(menuName: string) {
	const normalizedName = normalizeMenuName(menuName);
	if (!normalizedName) return false;
	if (EXCLUDED_MENU_PATTERNS.some((pattern) => pattern.test(normalizedName))) return false;
	if (VOTABLE_MENU_PATTERNS.some((pattern) => pattern.test(normalizedName))) return true;
	return false;
}

export function getVoteWindow(menuDate: string, mealSlot: CafeteriaMealSlot) {
	const opensAt = new Date(`${menuDate}T${VOTE_OPENING_TIMES[mealSlot]}:00+09:00`);
	const closesAt = new Date(`${menuDate}T00:00:00+09:00`);
	closesAt.setUTCDate(closesAt.getUTCDate() + 4);

	return { opensAt, closesAt };
}
