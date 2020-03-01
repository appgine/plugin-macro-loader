
import * as errorhub from '../errorhub'
import querySelectorAll from '../lib/querySelectorAll'


const loaded = {};


/**
 * @param {Element}
 */
export function loadScripts($dom)
{
	querySelectorAll($dom, 'script[type^="data-plugin/"]').forEach(function($script) {
		const pvar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		loaded[pvar] = $script.textContent;
	});
}


/**
 * @param {Element}
 */
export function unloadScripts($dom)
{
	querySelectorAll($dom, 'script[type^="data-plugin/"]').forEach(function($script) {
		const pvar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		delete loaded[pvar];
	});
}


/**
 * @param {string}
 * @return {mixed}
 */
export function loadData(pvar)
{
	try {
		return JSON.parse(loaded[pvar] || pvar || JSON.stringify(null));

	} catch (e) {
		loaded[pvar] && errorhub.dispatch(errorhub.ERROR.LOADDATA, 'Failed loaddata', e, pvar);
	}

	return pvar;
}
