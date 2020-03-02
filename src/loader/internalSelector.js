
import querySelectorAll from '../lib/querySelectorAll'

const internalSelector = {};


/**
 * @param {string}
 * @param {function}
 * @return {function}
 */
export function bindInternalSelector(selector, fn) {
	internalSelector[selector] = internalSelector[selector] || [];

	const plugin = [fn, []];
	internalSelector[selector].push(plugin);

	return function() {
		internalSelector[selector].splice(internalSelector[selector].indexOf(plugin), 1);
	}
}


/**
 * @param {Element}
 * @param {function}
 * @param {object}
 */
export function loadInternalSelector($dom, options)
{
	Object.keys(internalSelector).forEach(function(selector) {
		querySelectorAll($dom, selector).forEach(function($node) {
			internalSelector[selector].forEach(function([fn, $nodeList]) {
				fn($node, {...options});
			});
		});
	});
}
