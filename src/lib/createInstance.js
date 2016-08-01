
import redboxWrapper from './redboxWrapper'
import PluginApi from './api'
import destroy from './destroy'


/**
 * @param {object}
 * @param {object}
 * @param {object}
 */
export default function createInstance(pluginObj, createPlugin) {
	pluginObj.plugin = createPlugin;
	pluginObj.hotReload = function(newPlugin) {
		pluginObj.plugin = newPlugin===null ? null : (newPlugin || pluginObj.plugin);
		pluginObj.PluginApi = PluginApi;
		pluginObj.pluginApi = undefined;
		pluginObj.api = function(name) {};
		pluginObj.instance = undefined;

		redboxWrapper(pluginObj, () => destroy(pluginObj, !!pluginObj.plugin));
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
