
export { loadScripts, unloadScripts } from './loader/scripts'
export { load, unloadPlugins, findPlugins } from './loader/selector'
export { command, commandAll } from './loader/selector'
export { loadGlobal, unloadGlobal } from './loader/global'
export { loadSystem, unloadSystem } from './loader/system'
export contains from './lib/contains'
export querySelectorAll from './lib/querySelectorAll'
export resolveDataAttribute from './lib/resolveDataAttribute'

import { mockApi as _mockApi } from './loader/api'
import { bindApi as _bindApi } from './loader/api'
import { bindGlobal as _bindGlobal } from './loader/global'
import { bindSystem as _bindSystem } from './loader/system'
import { bind as _bind } from './loader/selector'
import createPluginApi from './lib/api'
import createCreateInstance from './lib/createInstance'

import { findPlugins, unloadPlugins } from './loader/selector'
import { updateGlobal } from './loader/global'

const _PluginApi = createPluginApi();
const _createInstance = createCreateInstance(_PluginApi);

export const mockApi = _mockApi(_PluginApi);
export const bindApi = _bindApi(_PluginApi);
export const bindSystem = _bindSystem(_createInstance);
export const bindGlobal = _bindGlobal(_createInstance);
export const { bind, bindSelector, bindAttribute } = _bind(_createInstance);


export function loader(fn) {
	const __PluginApi = createPluginApi(_PluginApi);
	const __createInstance = createCreateInstance(__PluginApi);
	const mockApi = _mockApi(__PluginApi);
	const bindApi = _bindApi(__PluginApi);
	const bindSystem = _bindSystem(__createInstance);
	const bindGlobal = _bindGlobal(__createInstance);
	const { bind, bindSelector, bindAttribute } = _bind(__createInstance);

	fn({ mockApi, bindApi, bindSystem, bindGlobal, bind, bindSelector, bindAttribute });
}


export function loaderGlobal(fn) {
	fn({ mockApi, bindApi, bindSystem, bindGlobal, bind, bindSelector, bindAttribute });
}


/**
 * @param {object}
 * @param {object}
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
 * @param {object}
 * @param {object}
 */
export function updatePlugin(plugin, data)
{
	Object.keys(data||{}).forEach(function(key) {
		const [, name, method='update'] = key.match(/^(.*?)(?:::(.+))?$/);

		if (plugin && plugin.instance && plugin.instance[method] && !name) {
			plugin.instance[method](data[key]);
		}
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
