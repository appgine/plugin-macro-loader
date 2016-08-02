
import redboxWrapper from './redboxWrapper'
import destroy from './destroy'


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
			redboxWrapper(pluginObj, () => destroy(pluginObj, newPlugin!==null));

			pluginObj.plugin = newPlugin===null ? null : (newPlugin || pluginObj.plugin);
			pluginObj.pluginApi = undefined;
			pluginObj.api = function(name) {};
			pluginObj.instance = undefined;

			pluginObj.plugin && redboxWrapper(pluginObj, function() {
				const pluginApi = new PluginApi(pluginObj);

				pluginObj.pluginApi = pluginApi;
				pluginObj.api = pluginApi.get.bind(pluginApi);
				pluginObj.instance = pluginObj.plugin.apply(pluginApi, pluginObj.pluginArguments||[])||{};
			});
		}

		pluginObj.hotReload();
		return pluginObj;
	}
}
