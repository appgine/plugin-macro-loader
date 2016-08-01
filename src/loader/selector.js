
import { bindInternalSelector, loadInternalSelector } from './internalSelector'
import { loadData } from './scripts'

import resolveDataAttribute from '../lib/resolveDataAttribute'
import redboxWrapper from '../lib/redboxWrapper'
import contains from '../lib/contains'
import createInstance from '../lib/createInstance'
import destroy from '../lib/destroy'
import createState from '../lib/state'

const internalBinders = {};

const _plugins = {};
const _loaded = [];


bindInternalSelector('[data-plugin]:not(noscript)', function($element, options) {
	resolveDataAttribute($element, 'data-plugin', function({ pluginName, pluginId, name, data }) {
		const plugin = _plugins[pluginName];
		const pluginArguments = [$element, data, createState(), pluginId];

		const pluginObj = { $element, plugin, pluginArguments, pluginName, pluginId, name, options }
		_loaded.push(createInstance(pluginObj, plugin));
	});
});


/**
 * @param {string}
 * @param {function}
 */
export function bind(name, plugin)
{
	internalBinders[name] = internalBinders[name] || createBinder(name);
	internalBinders[name].hotReload(plugin);
	return internalBinders[name];
}


function createBinder(name)
{
	let hotReloaded = false;

	return {
		plugins() {
			return findPlugins(({ name: _name, plugin }) => _name===name && plugin===_plugins[name]);
		},
		hotReload(plugin) {
			if (!plugin) {
				return this.willDispose();
			}

			hotReloaded = true;

			const oldPlugin = _plugins[name];
			const newPlugin = plugin && plugin.default || plugin;

			_plugins[name] = newPlugin;
			hotReload(name, oldPlugin, newPlugin);
		},
		willDispose() {
			hotReloaded = false;

			setTimeout(function() {
				if (hotReloaded===false) {
					const oldPlugin = _plugins[name];
					delete _plugins[name];
					delete internalBinders[name];
					hotReload(name, oldPlugin);
				}
			}, 0);
		},
	}
}


/**
 * @param {string}
 * @param {function}
 */
export function bindSelector(selector, plugin)
{
	const pluginName = '$' + selector;
	return _bindSelector(pluginName, selector, plugin, $element => [$element, createState()]);
}


/**
 * @param {string}
 * @param {function}
 */
export function bindAttribute(attr, plugin)
{
	const selector = '['+attr+']';
	const pluginName = selector;
	return _bindSelector(pluginName, selector, plugin, function($element) {
		const pvar = $element.getAttribute(attr)||'';
		const pluginArguments = [$element, loadData(pvar), createState()];

		return pluginArguments;
	});
}


/**
 * @param {string}
 * @param {string}
 * @param {function}
 * @param {function}
 */
function _bindSelector(pluginName, selector, plugin, createArguments) {
	plugin = plugin.default || plugin;

	const loader = bindInternalSelector(selector, function($element) {
		const pluginArguments = createArguments($element);
		const pluginObj = { $element, plugin, pluginArguments, pluginName, options: {} }
		_loaded.push(createInstance(pluginObj, plugin));
	});

	return {
		plugins() {
			return findPlugins(({ name: _name, plugin: _plugin }) => _name===name && _plugin===plugin);
		},
		hotReload(newPlugin) {
			if (!newPlugin) {
				return this.willDispose();
			}

			const oldPlugin = plugin;
			plugin = newPlugin && newPlugin.default || newPlugin;
			hotReload(pluginName, oldPlugin, plugin);
		},
		willDispose() {
			const oldPlugin = plugin;
			plugin = undefined;
			hotReload(pluginName, oldPlugin);
			loader();
		},
	}
}


/**
 * @param {string}
 * @param {function}
 * @param {function}
 */
function hotReload(name, oldPlugin, newPlugin=null)
{
	findPlugins(({ plugin, pluginName }) => pluginName===name && plugin===oldPlugin).forEach(pluginObj => {
		pluginObj.hotReload(newPlugin);
	});
}


/**
 * @param {Element}
 * @param {Object}
 * @return {Array}
 */
export function load($dom, options={})
{
	loadInternalSelector($dom, options);
}



/**
 * @param {array}
 */
export function unloadPlugins(plugins)
{
	plugins.forEach(pluginObj => {
		if (_loaded.indexOf(pluginObj)!==-1) {
			_loaded.splice(_loaded.indexOf(pluginObj), 1);
		}

		destroy(pluginObj, false);
	});
}


/**
 * @param {Element|function}
 * @return {array}
 */
export function findPlugins(cond)
{
	if (typeof cond === 'function') {
		return _loaded.filter(val => cond(val));
	}

	return findPlugins(({ $element }) => contains(cond, $element));

}


/**
 * @return {mixed}
 */
export function command(name, command, ...args)
{
	const result = commandAll(name, command, ...args);
	return result.length && result[0] || null;
}


/**
 * @param {function|string|Element}
 * @param {string}
 * @param {mixed..}
 * @return {Array}
 */
 export function commandAll(name, command, ...args)
 {
	return _loaded.
		filter(val => Object.values(val).indexOf(name)!==-1).
		filter(({ instance }) => instance && instance[command]).
		map(({ instance }) => {
			try { return instance[command](...args) } catch (e) {}
		});
}
