
import createState from './state'

const $scripts = {};
const $redbox = document.createElement('div');
const internalBinders = {};
const internalSelector = {};

const _plugins = {};
const _pluginsGlobal = {};

const _loaded = [];
const _loadedGlobal = {};


function bindInternalSelector(selector, fn) {
	internalSelector[selector] = internalSelector[selector] || [];

	const plugin = [fn, []];
	internalSelector[selector].push(plugin);

	return function() {
		internalSelector[selector].splice(internalSelector[selector].indexOf(plugin), 1);
	}
}


bindInternalSelector('[data-plugin]:not(noscript)', function($element, options) {
	resolveDataPlugin($element, function(pluginName, pluginId, name, pvar) {
		const plugin = _plugins[pluginName];
		const pluginArguments = [$element, loadData(pvar), createState(), pluginId];

		const instance = createInstance(plugin, pluginArguments);
		_loaded.push({ $element, plugin, pluginArguments, pluginName, pluginId, name, options, instance });
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
		const instance = createInstance(plugin, pluginArguments);
		_loaded.push({ $element, plugin, pluginArguments, pluginName, instance, options: {} });
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
	const $found = Array.from($dom.querySelectorAll('script[type^="data-plugin/"]'));

	$found.forEach(function($script) {
		const pvar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		$scripts[pvar] = $script;
	});
}


/**
 * @param {Element}
 */
export function unloadScripts($dom)
{
	const $found = Array.from($dom.querySelectorAll('script[type^="data-plugin/"]'));

	$found.forEach(function($script) {
		const pvar = ($script.getAttribute('type')||'').replace(/data-plugin\//, '');
		delete $scripts[pvar];
	});
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
	findPlugins(({ plugin, pluginName }) => pluginName===name && plugin===oldPlugin).forEach(plugin => {
		plugin.plugin = newPlugin;
		plugin.instance = createInstance(newPlugin, plugin.pluginArguments, plugin.instance);
	});
}


function createInstance(plugin, pluginArguments, prevInstance) {
	if (process.env.NODE_ENV !== 'production') {
		if (pluginArguments.$redbox) {
			const ReactDOM = require('react-dom');
			ReactDOM.unmountComponentAtNode(pluginArguments.$redbox);
			$redbox.removeChild(pluginArguments.$redbox);
			delete pluginArguments.$redbox;

			if ($redbox.children.length===0 && $redbox.parentNode) {
				$redbox.parentNode.removeChild($redbox);
			}
		}
	}

	try {
		if (prevInstance && !prevInstance.destroy) {
			return null;

		} else if (prevInstance) {
			prevInstance.destroy();
		}

		return plugin && plugin(...pluginArguments);

	} catch (e) {
		if (process.env.NODE_ENV !== 'production') {
			if (document.body && $redbox.children.length===0) {
				document.body.appendChild($redbox);
			}

			const React = require('react');
			const ReactDOM = require('react-dom');
			const RedBox = require('redbox-react');
			pluginArguments.$redbox = document.createElement('div');
			ReactDOM.render(React.createElement(RedBox.default||RedBox, {error: e}), pluginArguments.$redbox);
			$redbox.appendChild(pluginArguments.$redbox);
		}
	}

	return null;
}


/**
 * @param {Element}
 * @param {Object}
 * @return {Array}
 */
export function load($dom, options={})
{
	Object.keys(internalSelector).forEach(function(selector) {
		const matches = [].concat(matchesSelector($dom, selector) ? $dom : [], Array.from($dom.querySelectorAll(selector)));

		matches.forEach(function($node) {
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
	Array.from($dom.querySelectorAll('noscript[data-plugin]')).forEach(function($node) {
		resolveDataPlugin($node, function(pluginName, pluginId, name, pvar) {
			const data = loadData(pvar);

			if (_pluginsGlobal[pluginName]) {
				_loadedGlobal[name] = _loadedGlobal[name] || _pluginsGlobal[pluginName](pluginId);
				_loadedGlobal[name].update(data);
			}
		});
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
 * @param {array}
 */
export function unloadPlugins(plugins)
{
	plugins.forEach(plugin => {
		const { instance } = plugin;

		if (_loaded.indexOf(plugin)!==-1) {
			_loaded.splice(_loaded.indexOf(plugin), 1);
		}

		instance && instance.destroy && instance.destroy();
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
export function resolveDataPlugin($element, fn)
{
	($element.getAttribute('data-plugin')||'').split('$').filter(attr => attr).map(function(attr) {
		let [name, ...pvar] = attr.split(':');

		const matched = name.match(/^(.+)\[(.*)\]$/);
		const pluginName = matched ? matched[1] : name;
		const pluginId = matched ? matched[2] : '';

		name += matched ? "" : "[]";
		pvar = pvar.join(':') || null;

		fn(pluginName, pluginId, name, pvar);
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
