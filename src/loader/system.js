
import destroy from '../lib/destroy'
import createState from '../lib/state'

const _pluginsSystem = [];
let _loadedSystem = false;


/**
 * @param {function}
 */
export function bindSystem(createInstance) {
	return function(plugin) {
		const pluginObj = {
			load(reload=false) {
				if (this.loaded===reload) {
					this.loaded = true;
					destroy(this);
					createInstance(this, plugin);
				}
			},
			loaded: false,
			instance: undefined,
			pluginArguments: [createState()],
		};

		_pluginsSystem.push(pluginObj);
		_loadedSystem && pluginObj.load(false);

		return {
			plugins() { return []; },
			hotReload(_plugin) {
				plugin = _plugin;
				pluginObj.load(true);
			},
			willDispose() {
				pluginObj.loaded = false;
				destroy(pluginObj);

				if (_pluginsSystem.indexOf(pluginObj)!==-1) {
					_pluginsSystem.splice(_pluginsSystem.indexOf(pluginObj), 1);
				}
			},
		}
	}
}


export function loadSystem()
{
	if (_loadedSystem===false) {
		_loadedSystem = true;
		_pluginsSystem.forEach(pluginObj => pluginObj.load(false));
	}
}


export function unloadSystem()
{
	if (_loadedSystem) {
		_loadedSystem = false;
		_pluginsSystem.forEach(pluginObj => destroy(pluginObj));
	}
}
