
import { findPlugins, pluginHotReload } from './selector'
import PluginApi from '../lib/api'

const apiBinder = {};


/**
 * @param {string}
 * @param {function|object}
 */
export function bindApi(name, api) {
	apiBinder[name] = apiBinder[name] || createBinder(name);
	apiBinder[name].hotReload(api);
	return apiBinder[name];
}


function createBinder(name) {
	let hotReloaded = false;
	let prevApi = null;

	return {
		hotReload(api) {
			api = api.default || api;

			if (typeof api === 'function') {
				api = {[name]: api};
			}

			if (prevApi) {
				Object.keys(prevApi).forEach(key => {
					if (key!=='destroy') {
						delete PluginApi.prototype[key];
					}
				});
			}

			const exists = [];
			Object.keys(api).forEach(key => {
				if (key!=='destroy' && PluginApi.prototype[key]!==undefined) {
					exists.push(key);
				}
			});

			if (exists.length) {
				throw new Error("PluginApi methods '" + exists.join(', ') + "' already exist.");
			}

			Object.keys(api).forEach(key => {
				if (key!=='destroy') {
					PluginApi.prototype[key] = function() {
						const apiFn = api[key].default || api[key];
						return this._context[name] = apiFn(this._context[name], ...arguments);
					};
				}
			});

			hotReloaded = true;
			prevApi = api;

			let error = undefined;
			findPlugins(({ pluginApi }) => pluginApi && (name in pluginApi._context)).
				forEach(pluginObj => {
					try {
						pluginHotReload(pluginObj, pluginObj.plugin);

					} catch (e) {
						error = e;
					}
				});

			PluginApi._destroy[name] = api.destroy;
			if (error) throw error;
		},
		willDispose() {
			hotReloaded = false;

			setTimeout(() => {
				if (hotReloaded===false) {
					this.hotReload({});
				}
			}, 0);
		}
	}
}

