
export { bindApi } from './api'

import PluginApi from './api'
import createState from './state'
import destroy from './destroy'
import redboxWrapper from './redboxWrapper'

const $scripts = {};
const internalBinders = {};
const internalSelector = {};

const _plugins = {};
const _pluginsGlobal = {};
const _pluginsSystem = [];

const _loaded = [];
const _loadedGlobal = {};
let _loadedSystem = false;


function bindInternalSelector(selector, fn) {
	internalSelector[selector] = internalSelector[selector] || [];

	const plugin = [fn, []];
	internalSelector[selector].push(plugin);

	return function() {
		internalSelector[selector].splice(internalSelector[selector].indexOf(plugin), 1);
	}
}


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
export function bindGlobal(name, plugin)
{
	_pluginsGlobal[name] = plugin.default || plugin;
	return {
		plugins() { return []; },
		hotReload() {},
		willDispose() {},
	}
}


/**
 * @param {function}
 */
export function bindSystem(plugin)
{
	let loaded = false;
	let result = null;
	function destroy() {
		if (typeof result === 'function') {
			result();

		} else if (result && typeof result.destroy === 'function') {
			result.destroy();
		}

		result = null;
	}

	const load = function(reload=false) {
		if (loaded===reload) {
			loaded = true;
			destroy();
			result = plugin();
		}
	}

	_pluginsSystem.push(load);
	_loadedSystem && load(false);

	return {
		plugins() { return []; },
		hotReload(_plugin) {
			plugin = _plugin;
			load(true);
		},
		willDispose() {
			loaded = false;
			destroy();

			if (_pluginsSystem.indexOf(load)!==-1) {
				_pluginsSystem.splice(_pluginsSystem.indexOf(load), 1);
			}
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
 * @param {Element}
 * @param {string}
 * @return {Array}
 */
export function querySelectorAll($dom, selector)
{
	return [].concat(matchesSelector($dom, selector) ? $dom : [], Array.from($dom.querySelectorAll(selector)));
}

const matchesSelector = (function() {
	const p = Element.prototype;
	const f = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || function(selector) {
		return [].indexOf.call(document.querySelectorAll(selector), this) !== -1;
	};

	return function($dom, selector) {
		return $dom instanceof Element ? f.call($dom, selector) : false;
	}
})();


/**
 * @param {string}
 * @param {function}
 * @param {function}
 */
function hotReload(name, oldPlugin, newPlugin)
{
	findPlugins(({ plugin, pluginName }) => pluginName===name && plugin===oldPlugin).forEach(pluginObj => {
		pluginHotReload(pluginObj, newPlugin);
	});
}


/**
 * @param {object}
 * @param {object}
 */
export function pluginHotReload(pluginObj, plugin) {
	pluginObj.plugin = plugin;
	redboxWrapper(pluginObj, () => destroy(pluginObj, !!plugin));
	createInstance(pluginObj, plugin);
}


/**
 * @param {object}
 * @param {object}
 */
function createInstance(pluginObj, createPlugin) {
	pluginObj.pluginApi = undefined;
	pluginObj.api = function(name) {};
	pluginObj.instance = undefined;

	createPlugin && redboxWrapper(pluginObj, function() {
		const pluginApi = new PluginApi();

		pluginObj.pluginApi = pluginApi;
		pluginObj.api = pluginApi.get.bind(pluginApi);
		pluginObj.instance = createPlugin.apply(pluginApi, pluginObj.pluginArguments)||{};
	});

	return pluginObj;
}


/**
 * @param {Element}
 * @param {Object}
 * @return {Array}
 */
export function load($dom, options={})
{
	Object.keys(internalSelector).forEach(function(selector) {
		querySelectorAll($dom, selector).forEach(function($node) {
			internalSelector[selector].forEach(function([fn, $nodeList]) {
				if ($nodeList.indexOf($node)===-1) {
					$nodeList.push($node);
					fn($node, {...options});
				}
			});
		});
	});
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


export function loadSystem()
{
	if (_loadedSystem===false) {
		_loadedSystem = true;
		_pluginsSystem.forEach(load => load(false));
	}
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
 * @param {object}
 * @param {array}
 */
export function updatePlugins(plugins, data)
{
	Object.keys(data||{}).forEach(function(key) {
		const [, name, method='update'] = key.match(/^(.*?)(?:::(.+))?$/);

		_loadedGlobal[name] && _loadedGlobal[name].update(data[key]);

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


/**
 * @param {Element}
 * @param {function}
 */
export function resolveDataAttribute($element, attrName, fn)
{
	($element.getAttribute(attrName)||'').split('$').filter(attrValue => attrValue).map(function(attrValue) {
		let [attrPlugin, ...pvar] = attrValue.split(':');

		const matched = attrPlugin.match(/^(?:([^\[]*)(?:\[([^\]]*)\])?@)?(([^\[]*)(?:\[([^\]]*)\])?)$/);
		const target = matched[1]||'';
		const targetId = matched[2]||'';
		const name = matched[3] + (matched[5]===undefined ? "[]" : "");
		const pluginName = matched[4];
		const pluginId = matched[5]||'';
		const data = loadData(pvar.join(':') || null)

		fn({ pluginName, pluginId, target, targetId, name, data });
	});
}


/**
 * @param {string}
 * @return {mixed}
 */
function loadData(pvar)
{
	try {
		if ($scripts[pvar]) {
			return JSON.parse($scripts[pvar].textContent);

		} else if (pvar) {
			return JSON.parse(pvar);
		}

	} catch (e) {}

	return pvar;
}


/**
 * @param {Element=}
 * @param {Element=}
 * @return {boolean}
 * see: Closure Library - goog.dom.contains
 */
export function contains(parent, descendant) {
  // We use browser specific methods for this if available since it is faster
  // that way.

  // IE DOM
  if (parent.contains && descendant.nodeType == 1) {
    return parent == descendant || parent.contains(descendant);
  }

  // W3C DOM Level 3
  if (typeof parent.compareDocumentPosition != 'undefined') {
    return parent == descendant ||
        Boolean(parent.compareDocumentPosition(descendant) & 16);
  }

  // W3C DOM Level 1
  while (descendant && parent != descendant) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
}
