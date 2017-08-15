
import clone from './clone'

const _plugins = [];


export default function createPluginApi(...apiParents) {

	function _PluginApi(pluginThis, hotReload) {
		if (Object.defineProperty) {
			Object.defineProperty(this, '_context', {
				value: {},
				enumerable: false,
				writable: false
			});

		} else {
			this._context = {};
		}

		_plugins.push(this);
		this._PluginApi = _PluginApi;
		this._pluginThis = pluginThis;
		this._hotReload = hotReload;
	}

	_PluginApi.prototype = PluginApi.prototype;

	_PluginApi._apiParents = apiParents;
	_PluginApi._apiList = {};
	_PluginApi._apiDestroy = {};
	_PluginApi._apiInitialState = {};

	_PluginApi.mock = function(...keys) {
		keys.forEach(key => PluginApi.prototype[key] = PluginApi.prototype[key] || apiAccessor(key));
	}

	_PluginApi.hotReload = function(name, apiNew={}) {
		const _apiNew = {...apiNew};
		delete _apiNew.destroy;
		delete _apiNew.initialState;

		const exists = [];
		Object.keys(_PluginApi._apiList).
			filter(apiName => apiName!==name).
			map(apiName => _PluginApi._apiList[apiName]).
			forEach(apiSibling => {
				Object.keys(_apiNew).forEach(key => {
					if (apiSibling[key]!==undefined) {
						exists.push(key);
					}
				});
			});

		if (exists.length) {
			throw new Error("PluginApi methods '" + exists.join(', ') + "' already exist.");
		}

		_PluginApi._apiList[name] = _apiNew;

		Object.keys(_apiNew).forEach(key => {
			PluginApi.prototype[key] = PluginApi.prototype[key] || apiAccessor(key);
		});

		hotReload(name);

		_PluginApi._apiDestroy[name] = apiNew.destroy;
		_PluginApi._apiInitialState[name] = apiNew.initialState;
	};

	return _PluginApi;
}


function apiAccessor(key) {
	return function() {
		const pluginApiList = [this._PluginApi].concat(this._PluginApi._apiParents);

		for (let i=0; i<pluginApiList.length; i++) {
			const apiList = pluginApiList[i]._apiList;

			for (let name of Object.keys(apiList)) {
				if (key in apiList[name]) {
					const apiFn = apiList[name][key].default || apiList[name][key];

					this._context[name] = this._context[name] || [];

					const initialState = pluginApiList[i]._apiInitialState[name];

					if (initialState) {
						if (this._context[name][i]===undefined) {
							this._context[name][i] = (typeof initialState==='function') ? initialState() : clone(initialState);
						}

						return apiFn.call(this._pluginThis, this._context[name][i], ...arguments);

					} else {
						const result = apiFn.call(this._pluginThis, this._context[name][i], ...arguments);

						if (this._context[name][i]===undefined) {
							this._context[name][i] = result;
						}
					}
				}
			}
		}
	}
}

function PluginApi() {}


PluginApi.prototype.eachApi = function(name, fn) {
	(this._context[name]||[]).forEach(fn);
}

PluginApi.prototype.destroy = function() {
	if (_plugins.indexOf(this)!==-1) {
		_plugins.splice(_plugins.indexOf(this), 1);
	}

	Object.keys(this._context).forEach(name => {
		for (let i=0; i<this._context[name].length; i++) {
			if (this._context[name][i]!==undefined) {
				const _apiDestroy = i ? this._PluginApi._apiParents[i-1]._apiDestroy : this._PluginApi._apiDestroy;

				if (typeof _apiDestroy[name]==='function') {
					_apiDestroy[name](this._context[name][i]);
				}
			}
		}
	});
}

function hotReload(name) {
	let error = null;
	_plugins.
		filter(pluginApi => (name in pluginApi._context)).
		forEach(({ _hotReload }) => {
			try {
				_hotReload && _hotReload();

			} catch (e) {
				error = e;
			}
		});
}
