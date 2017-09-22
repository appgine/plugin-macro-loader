
import * as errorhub from '../errorhub'
import querySelectorAll from '../lib/querySelectorAll'


const $scripts = {};


/**
 * @param {Element}
 */
export function loadScripts($dom)
{
	querySelectorAll($dom, 'script[type^="data-plugin/"]').forEach(function($script) {
		const pvar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		$scripts[pvar] = $script;
	});
}


/**
 * @param {Element}
 */
export function unloadScripts($dom)
{
	querySelectorAll($dom, 'script[type^="data-plugin/"]').forEach(function($script) {
		const pvar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		delete $scripts[pvar];
	});
}


/**
 * @param {string}
 * @return {mixed}
 */
export function loadData(pvar)
{
	try {
		if ($scripts[pvar]) {
			return JSON.parse($scripts[pvar].textContent);
		}
	} catch (e) {
		errorhub.dispatch(errorhub.ERROR.LOADDATA, 'Failed loaddata', e, pvar);
	}

	try {
		if (pvar) {
			return JSON.parse(pvar);
		}

	} catch (e) {}

	return pvar;
}
