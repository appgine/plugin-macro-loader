
const _asSelector = {};

const _plugins = {};
const _pluginsGlobal = {};

const _loaded = [];
const _loadedGlobal = {};

const _bindAsSelector = (selector, fn) => (_asSelector[selector] = _asSelector[selector] || []).push([fn, []]);


_bindAsSelector('[data-plugin]:not(noscript)', function($element, options) {
	resolveDataPlugin($element, function(pluginName, pluginId, name, pvar) {
		const data = loadData(pvar, options.permanent||false);

		if (_plugins[pluginName]) {
			const instance = _plugins[pluginName]($element, data, pluginId);
			_loaded.push({ $element, pluginName, pluginId, name, options, instance });
		}
	});
});


/**
 * @param {string}
 * @param {function}
 */
export function bind(name, plugin)
{
	_plugins[name] = plugin.default || plugin;
}


/**
 * @param {string}
 * @param {function}
 */
export function bindGlobal(name, plugin)
{
	_pluginsGlobal[name] = plugin.default || plugin;
}


/**
 * @param {string}
 * @param {function}
 */
export function bindSelector(selector, plugin)
{
	plugin = plugin.default || plugin;

	_bindAsSelector(selector, function($element) {
		const instance = plugin($element);
		_loaded.push({ $element, name: '$'+selector, instance, options: {} });
	});
}


/**
 * @param {string}
 * @param {function}
 */
export function bindAttribute(attr, plugin)
{
	plugin = plugin.default || plugin;
	name = '['+attr+']';

	_bindAsSelector(name, function($element) {
		const pvar = $element.getAttribute(attr)||'';
		const data = loadData(pvar, false);
		const instance = plugin($element, data);
		_loaded.push({ $element, name, instance, options: {} });
	});
}


/**
 * @param {Element}
 */
export function evalScripts($dom)
{
	const $scripts = [].filter.call($dom.querySelectorAll('script'), function($script) {
		return !!String($script.textContent).match(/\s*var p_[a-zA-Z0-9]+/);
	});

	$scripts.forEach($script => window.eval($script.textContent));
	$scripts.forEach($script => $script.parentNode.removeChild($script));
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
 * @param {Element}
 * @param {bool}
 * @param {Object}
 * @return {Array}
 */
export function load($dom, permanent=false, options={})
{
	Object.keys(_asSelector).forEach(function(selector) {
		const matches = [].concat(matchesSelector($dom, selector) ? $dom : [], Array.from($dom.querySelectorAll(selector)));

		matches.forEach(function($node) {
			_asSelector[selector].forEach(function([fn, $nodeList]) {
				if ($nodeList.indexOf($node)===-1) {
					$nodeList.push($node);
					fn($node, {...options, permanent});
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
			const data = loadData(pvar, true);

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
		_loaded.pull(plugin);
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
		pvar = pvar.join(':');

		fn(pluginName, pluginId, name, pvar);
	});
}


/**
 * @param {string}
 * @param {boolean}
 * @return {mixed}
 */
export function loadData(pvar, permanent)
{
	try {
		const data = window[pvar] || (pvar && JSON.parse(pvar));
		permanent && (window[pvar] = undefined);
		return data;

	} catch (e) {
		return pvar;
	}
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
