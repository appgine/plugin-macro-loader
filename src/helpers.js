

export function isArgumentObj(fn, ...allowed) {
	allowed = ['_ref'].concat(...allowed);

	if (fn.toString().match(/^[^\(]*\(\s*\{/)) {
		return true;
	}

	const matched = fn.toString().match(/^[^\(]*\(\s*([a-zA-Z0-9_]+)\s*\)/);

	if (matched && allowed.indexOf(matched[1])!==-1) {
		return true;
	}

	return false;
}
