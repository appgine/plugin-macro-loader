

export default function PluginApi() {
	if (Object.defineProperty) {
		Object.defineProperty(this, '_context', {
			value: {},
			enumerable: false,
			writable: false
		});

	} else {
		this._context = {};
	}
}

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
