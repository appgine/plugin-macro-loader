

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
		PluginApi.prototype[key] = function() {
			const apiFn = api[key].default || api[key];
			return this._context[name] = apiFn(this._context[name], ...arguments);
		};
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

	this.get = this.get.bind(this);
}

PluginApi.prototype.get = function(name) {
	return this._context[name];
}
