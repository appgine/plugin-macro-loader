
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

		fn({
			...binders,
			bindApi: patchBinder(bindApi),
			bindSystem: patchBinder(bindSystem),
			bindGlobal: patchBinder(bindGlobal),
			bind: patchBinder(bind),
			bindSelector: patchBinder(bindSelector),
			bindAttribute: patchBinder(bindAttribute),
			hotBindApi: hotReload.bind(undefined, bindApi),
			hotBindSystem: hotReload.bind(undefined, bindSystem),
			hotBindGlobal: hotReload.bind(undefined, bindGlobal),
			hotBind: hotReload.bind(undefined, bind),
			hotBindSelector: hotReload.bind(undefined, bindSelector),
			hotBindAttribute: hotReload.bind(undefined, bindAttribute),
		});
	});
}


function patchBinder(binder) {
	return function(name, plugin, ...args) {
		if (typeof name==='string' && typeof plugin==='object') {
			plugin = plugin.default||plugin;

		} else if (typeof name==='object') {
			name = name.default||name;
		}

		return binder(name, plugin, ...args);
	}
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

	return function hotReload(binder, name, plugin, ...args) {
		if (typeof name === 'number') {
			args.unshift(plugin);
			plugin = name;
			name = '';
		}

		const pluginName = binder.name + "('"+name+"'')";
		const pluginObj = name
			? binder(name, __webpack_require__(plugin)['default'], ...args)
			: binder(__webpack_require__(plugin)['default'], ...args);

		plugins.push(pluginObj);

		if (module.hot) {
			module.hot.accept(plugin, function() {
				const $update = document.createElement('div');
				$update.textContent = "Plugin " + pluginName + " update detected. Reloading..";
				$update.style.padding = '6px 3px';

				notify($update);

				try {
					pluginObj.hotReload(__webpack_require__(plugin)['default']);
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
