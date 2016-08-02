
const apiBinder = {};


/**
 * @param {string}
 * @param {function|object}
 */
export function bindApi(PluginApi) {
	return function(name, api) {
		apiBinder[name] = apiBinder[name] || createBinder(PluginApi, name);
		apiBinder[name].hotReload(api);
		return apiBinder[name];
	}
}


function createBinder(PluginApi, name) {
	let hotReloaded = false;

	return {
		hotReload(api) {
			api = api.default || api;

			if (typeof api === 'function') {
				api = {[name]: api};
			}

			hotReloaded = true;
			PluginApi.hotReload(name, api);
		},
		willDispose() {
			hotReloaded = false;

			setTimeout(() => {
				if (hotReloaded===false) {
					PluginApi.hotReload(name);
				}
			}, 0);
		}
	}
}

