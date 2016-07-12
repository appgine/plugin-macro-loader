

export default PluginApi;


/**
 * @param {string}
 * @param {function|object}
 */
export function bindApi(name, api) {
	api = api.default || api;

	if (typeof api === 'function') {
		api = {[name]: api};
	}

	Object.keys(api).forEach(key => {
		if (key==='destroy') {
			PluginApi._destroy[name] = api[key];

		} else if (PluginApi.prototype[key]!==undefined) {
			throw new Error("PluginApi method '" + key + "' already exists");

		} else {
			PluginApi.prototype[key] = function() {
				const apiFn = api[key].default || api[key];
				return this._context[name] = apiFn(this._context[name], ...arguments);
			};
		}
	});
}


function PluginApi() {
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
		if (this._context[name]!==undefined) {
			PluginApi._destroy[name](this._context[name]);
		}
	});
}
