
export { bindApi } from './loader/api'
export { loadScripts, unloadScripts } from './loader/scripts'
export { bind, bindSelector, bindAttribute } from './loader/selector'
export { load, unloadPlugins, findPlugins } from './loader/selector'
export { command, commandAll } from './loader/selector'
export { bindGlobal, loadGlobal } from './loader/global'
export { bindSystem, loadSystem } from './loader/system'
export contains from './lib/contains'
export querySelectorAll from './lib/querySelectorAll'
export resolveDataAttribute from './lib/resolveDataAttribute'

import { findPlugins, unloadPlugins } from './loader/selector'
import { updateGlobal } from './loader/global'


/**
 * @param {object}
 * @param {array}
 */
export function updatePlugins(plugins, data)
{
	Object.keys(data||{}).forEach(function(key) {
		const [, name, method='update'] = key.match(/^(.*?)(?:::(.+))?$/);

		updateGlobal(name, data[key]);

		plugins.
			filter(val => val.pluginName===name || val.name===name).
			filter(({ instance }) => instance && instance[method]).
			forEach(({ instance }) => instance[method](data[key]));
	});
}


/**
 * @param {Element}
 */
export function unload($dom)
{
	unloadPlugins(findPlugins($dom));
}


/**
 * @param {Element}
 * @param {object}
 */
export function update($dom, data)
{
	updatePlugins(findPlugins($dom), data);
}
