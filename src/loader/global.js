
import querySelectorAll from '../lib/querySelectorAll'
import resolveDataAttribute from '../lib/resolveDataAttribute'


const _pluginsGlobal = {};
const _loadedGlobal = {};


/**
 * @param {string}
 * @param {function}
 */
export function bindGlobal(createInstance)
{
	return function(name, plugin) {
		_pluginsGlobal[name] = plugin.default || plugin;
		return {
			plugins() { return []; },
			hotReload() {},
			willDispose() {},
		}
	}
}


/**
 * @param {Element}
 */
export function loadGlobal($dom)
{
	querySelectorAll($dom, 'noscript[data-plugin]').forEach(function($node) {
		resolveDataAttribute($node, 'data-plugin', function({ pluginName, pluginId, name, data }) {
			if (_pluginsGlobal[pluginName]) {
				_loadedGlobal[name] = _loadedGlobal[name] || _pluginsGlobal[pluginName](pluginId);
				_loadedGlobal[name].update(data);
			}
		});
	});
}


/**
 * @param {string}
 * @param {object}
 */
export function updateGlobal(name, data)
{
	_loadedGlobal[name] && _loadedGlobal[name].update(data[key]);
}
