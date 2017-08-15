
import redboxWrapper from './redboxWrapper'
import { destroyPlugin } from './destroy'
import { isArgumentObj } from '../helpers'


/**
 * @param {object}
 */
export default function createCreateInstance(PluginApi) {

	/**
	 * @param {object}
	 * @param {object}
	 * @return {object}
	 */
	return function createInstance(pluginObj, createPlugin) {
		pluginObj.plugin = createPlugin;
		pluginObj.hotReload = function(newPlugin) {
			redboxWrapper(pluginObj, () => destroyPlugin(pluginObj, newPlugin!==null));

			pluginObj.plugin = newPlugin===null ? null : (newPlugin || pluginObj.plugin);
			pluginObj.pluginApi = undefined;
			pluginObj.api = function(name) {};
			pluginObj.instances = [];

			pluginObj.plugin && redboxWrapper(pluginObj, function() {
				const pluginApi = new PluginApi({
					$element: pluginObj.$element,
					pluginName: pluginObj.pluginName,
					pluginId: pluginObj.pluginId,
					state: pluginObj.state,
					name: pluginObj.name,
				}, pluginObj.hotReload);

				pluginObj.pluginApi = pluginApi;
				pluginObj.api = pluginApi.eachApi.bind(pluginApi);

				if (isArgumentObj(pluginObj.plugin, 'plugin')) {
					pluginObj.instances.push(pluginObj.plugin.call(pluginApi, pluginObj.pluginArgumentsObj||{})||{});

				} else {
					pluginObj.instances.push(pluginObj.plugin.apply(pluginApi, pluginObj.pluginArguments||[])||{});
				}
			});
		}

		pluginObj.hotReload();
		return pluginObj;
	}
}
