
import notify from './lib/notify'
import { loader as _loader, loaderGlobal as _loaderGlobal } from './loader'


export function loader(parentModule, fn) {
	createHotLoader(_loader, parentModule, fn);
}


export function loaderGlobal(parentModule, fn) {
	createHotLoader(_loaderGlobal, parentModule, fn);
}


function createHotLoader(loader, parentModule, fn) {
	const hotReload = create(parentModule);

	loader(function(binders) {
		const { bindApi, bindSystem, bindGlobal, bind, bindSelector, bindAttribute } = binders;
		const hotBindApi = hotReload.bind(undefined, bindApi);
		const hotBindSystem = hotReload.bind(undefined, bindSystem);
		const hotBindGlobal = hotReload.bind(undefined, bindGlobal);
		const hotBind = hotReload.bind(undefined, bind);
		const hotBindSelector = hotReload.bind(undefined, bindSelector);
		const hotBindAttribute = hotReload.bind(undefined, bindAttribute);

		fn({
			...binders,
			hotBindApi,
			hotBindSystem,
			hotBindGlobal,
			hotBind,
			hotBindSelector,
			hotBindAttribute,
		});
	});
}


export default function create(parentModule) {
	const plugins = [];

	if (parentModule.hot) {
		parentModule.hot.addDisposeHandler(function() {
			plugins.forEach(plugin => plugin.willDispose());
			plugins.splice(0, plugins.length);
			notify("Plugins have been disposed.");
		});

		parentModule.hot.accept();
	}

	return function hotReload(binder, name, plugin, _export='default', decorator) {
		if (typeof name === 'number') {
			_export = plugin||_export;
			plugin = name;
			name = '';
		}

		if (typeof _export === 'function') {
			decorator = _export;
			_export = 'default';

		} else if (typeof decorator !== 'function') {
			decorator = plugin => plugin;
		}

		const pluginName = binder.name + "('"+name+"'')";
		const pluginObj = name
			? binder(name, decorator(__webpack_require__(plugin)[_export]))
			: binder(decorator(__webpack_require__(plugin)[_export]));

		plugins.push(pluginObj);

		if (module.hot) {
			module.hot.accept(plugin, function() {
				const $update = document.createElement('div');
				$update.textContent = "Plugin " + pluginName + " update detected. Reloading..";
				$update.style.padding = '6px 3px';

				notify($update);

				try {
					pluginObj.hotReload(decorator(__webpack_require__(plugin)[_export]));
					$update.style.backgroundColor = "#33cc33";
					$update.textContent = "Plugin " + pluginName + " reloaded.";

				} catch (e) {
					$update.style.backgroundColor = "#cc0000";
					$update.textContent = "Plugin " + pluginName + " update failed ("+e.message+").";
					console.error(e, e.stack);
				}
			});
		}

		return pluginObj;
	}
}
