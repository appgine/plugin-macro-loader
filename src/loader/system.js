
import destroy from '../lib/destroy'
import createInstance from '../lib/createInstance'
import createState from '../lib/state'


const _pluginsSystem = [];
let _loadedSystem = false;


/**
 * @param {function}
 */
export function bindSystem(plugin)
{
	const pluginObj = {
		loaded: false,
		instance: undefined,
		pluginArguments: [createState()],
	};

	const load = function(reload=false) {
		if (pluginObj.loaded===reload) {
			pluginObj.loaded = true;
			destroy(pluginObj);
			pluginObj.instance = createInstance(pluginObj, plugin);
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
			pluginObj.loaded = false;
			destroy(pluginObj);

			if (_pluginsSystem.indexOf(load)!==-1) {
				_pluginsSystem.splice(_pluginsSystem.indexOf(load), 1);
			}
		},
	}
}


export function loadSystem()
{
	if (_loadedSystem===false) {
		_loadedSystem = true;
		_pluginsSystem.forEach(load => load(false));
	}
}
