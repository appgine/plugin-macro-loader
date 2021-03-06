
import * as errorhub from '../errorhub'
import { bindInternalSelector, loadInternalSelector } from './internalSelector'
import { loadData } from './scripts'
import clone from '../lib/clone'

import resolveDataAttribute from '../lib/resolveDataAttribute'
import contains from '../lib/contains'
import { destroyPlugin } from '../lib/destroy'
import createState from '../lib/state'

const _binders = [];
const _loaded = [];


bindInternalSelector('[data-plugin]:not(noscript)', function($element, options) {
	resolveDataAttribute($element, 'data-plugin', function({ pluginName, pluginId, name, createData }) {
		const pluginDef = getPluginByName(pluginName);

		if (pluginDef) {
			const [ createInstance, plugin ] = pluginDef;
			const state = createState();
			const data = createData();
			const pluginArguments = [$element, data, state, pluginId];
			const pluginArgumentsObj = { $element, $root: $element, data, state, pluginId };

			const reloadData = function() {
				const data = createData();
				pluginArguments[1] = data;
				pluginArgumentsObj.data = data;
			}

			const pluginObj = { $element, plugin, state, reloadData, pluginArguments, pluginArgumentsObj, pluginName, pluginId, name, options }
			_loaded.push(createInstance(pluginObj, plugin));
		}
	});
});


function getPluginByName(pluginName) {
	for (let [createInstance, plugins] of _binders) {
		if (plugins[pluginName]) {
			return [createInstance, plugins[pluginName]];
		}
	}
}


export function bind(createInstance) {

	const plugins = {};
	const internalBinders = {};
	_binders.push([createInstance, plugins]);


	function createBinder(createInstance, name)
	{
		let hotReloaded = false;

		return {
			plugins() {
				return findPlugins(({ name: _name, plugin }) => _name===name && plugin===plugins[name]);
			},
			hotReload(plugin) {
				if (!plugin) {
					return this.willDispose();
				}

				hotReloaded = true;

				const oldPlugin = plugins[name];
				const newPlugin = plugin && plugin.default || plugin;

				plugins[name] = newPlugin;
				hotReload(name, oldPlugin, newPlugin);
			},
			willDispose() {
				hotReloaded = false;

				setTimeout(function() {
					if (hotReloaded===false) {
						const oldPlugin = plugins[name];
						delete plugins[name];
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
	 * @return {object}
	 */
	function bind(name, plugin)
	{
		internalBinders[name] = internalBinders[name] || createBinder(createInstance, name);
		internalBinders[name].hotReload(plugin);
		return internalBinders[name];
	}


	/**
	 * @param {string}
	 * @param {function}
	 * @param {mixed}
	 * @return {function}
	 */
	function bindSelector(selector, plugin, _data)
	{
		const pluginName = '$' + selector;
		return _bindSelector(createInstance, pluginName, selector, plugin, function($element, state) {
			const data = clone(_data);
			const pluginArguments = data===undefined ? [$element, state] : [$element, data, state];
			const pluginArgumentsObj = { $element, $root: $element, state, data };
			return { pluginArguments, pluginArgumentsObj };
		});
	}


	/**
	 * @param {string}
	 * @param {function}
	 */
	function bindAttribute(attr, plugin)
	{
		const selector = '['+attr+']';
		const pluginName = selector;
		return _bindSelector(createInstance, pluginName, selector, plugin, function($element, state) {
			const pvar = $element.getAttribute(attr)||'';
			const data = loadData(pvar);
			const pluginArguments = [$element, data, state];
			const pluginArgumentsObj = { $element, $root: $element, data, state };
			const reloadData = function() {
				const pvar = $element.getAttribute(attr)||'';
				const data = loadData(pvar);
				pluginArguments[1] = data;
				pluginArgumentsObj.data = data;
			}

			return { pluginArguments, pluginArgumentsObj, reloadData };
		});
	}


	return { bind, bindSelector, bindAttribute };
}


/**
 * @param {string}
 * @param {string}
 * @param {function}
 * @param {function}
 */
function _bindSelector(createInstance, pluginName, selector, plugin, createArguments) {
	plugin = plugin.default || plugin;

	const loader = bindInternalSelector(selector, function($element) {
		const state = createState();
		const { pluginArguments, pluginArgumentsObj, reloadData } = createArguments($element, state);
		const pluginObj = { $element, plugin, state, reloadData, pluginArguments, pluginArgumentsObj, pluginName, options: {} }
		_loaded.push(createInstance(pluginObj, plugin));
	});

	return {
		plugins() {
			return findPlugins(({ pluginName: _pluginName, plugin: _plugin }) => _pluginName===pluginName && _plugin===plugin);
		},
		hotReload(newPlugin) {
			if (!newPlugin) {
				return this.willDispose();
			}

			const oldPlugin = plugin;
			plugin = newPlugin.default || newPlugin;
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

		destroyPlugin(pluginObj, false);
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
			try {
				return instance[command](...args)

			} catch (e) {
				errorhub.dispatch(errorhub.ERROR.COMMAND, 'Failed commandAll', e, arguments);
			}
		});
}
