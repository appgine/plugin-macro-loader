

export function isArgumentObj(fn) {
	if (fn.toString().match(/^[^\(]*\(\s*\{/)) {
		return true;

	} else if (fn.toString().match(/^[^\(]*\(\s*_ref\s*\)/)) {
		return true;
	}

	return false;
}
