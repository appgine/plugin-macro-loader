

export default function PluginApi(pluginObj) {
	if (Object.defineProperty) {
		Object.defineProperty(this, '_context', {
			value: {},
			enumerable: false,
			writable: false
		});

	} else {
		this._context = {};
	}

	this._pluginObj = pluginObj;
	PluginApi._plugins.push(pluginObj);
}

PluginApi._plugins = [];
PluginApi._destroy = {};

PluginApi.prototype.get = function(name) {
	return this._context[name];
}

PluginApi.prototype.destroy = function(partial) {
	Object.keys(PluginApi._destroy).forEach(name => {
		if (typeof PluginApi._destroy[name]==='function' && this._context[name]!==undefined) {
			PluginApi._destroy[name](this._context[name]);
		}
	});
}

PluginApi.hotReload = function(name) {
	let error = null;
	PluginApi._plugins.
		filter(({ pluginApi }) => pluginApi && (name in pluginApi._context)).
		forEach(pluginObj => {
			try {
				pluginObj.hotReload();

			} catch (e) {
				error = e;
			}
		});
}
