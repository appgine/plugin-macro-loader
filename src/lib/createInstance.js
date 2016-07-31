
import redboxWrapper from './redboxWrapper'
import PluginApi from '../lib/api'


/**
 * @param {object}
 * @param {object}
 * @param {object}
 */
export default function createInstance(pluginObj, createPlugin) {
	pluginObj.PluginApi = PluginApi;
	pluginObj.pluginApi = undefined;
	pluginObj.api = function(name) {};
	pluginObj.instance = undefined;

	createPlugin && redboxWrapper(pluginObj, function() {
		const pluginApi = new PluginApi();

		pluginObj.pluginApi = pluginApi;
		pluginObj.api = pluginApi.get.bind(pluginApi);
		pluginObj.instance = createPlugin.apply(pluginApi, pluginObj.pluginArguments||[])||{};
	});

	return pluginObj;
}
