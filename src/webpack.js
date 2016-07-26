
const $notifier = document.createElement('div');
$notifier.style.position = 'fixed';
$notifier.style.top = '0';
$notifier.style.left = '0';
$notifier.style.zIndex = '9998';
$notifier.style.backgroundColor = '#FAFAFA';
$notifier.style.width = '600px';
$notifier.style.fontSize = '18px';
$notifier.style.lineHeight = '24px';


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

	return function hotReload(binder, name, plugin, _export='default') {
		if (typeof name === 'number') {
			_export = plugin||_export;
			plugin = name;
			name = '';
		}

		const pluginName = binder.name + "('"+name+"'')";
		const pluginObj = name
			? binder(name, __webpack_require__(plugin)[_export])
			: binder(__webpack_require__(plugin)[_export]);

		plugins.push(pluginObj);

		if (module.hot) {
			module.hot.accept(plugin, function() {
				const $update = document.createElement('div');
				$update.textContent = "Plugin " + pluginName + " update detected. Reloading..";
				$update.style.padding = '6px 3px';

				notify($update);

				try {
					pluginObj.hotReload(__webpack_require__(plugin)[_export]);
					$update.style.backgroundColor = "#33cc33";
					$update.textContent = "Plugin " + pluginName + " reloaded.";

				} catch (e) {
					$update.style.backgroundColor = "#cc0000";
					$update.textContent = "Plugin " + pluginName + " update failed ("+e.message+").";
					console.error(e, e.stack);
				}
			});
		}
	}
}


function notify($node) {
	if (process.env.NODE_ENV==='development') {
		if (typeof $node === "string") {
			const $dom = document.createElement('div');
			$dom.textContent = $node;
			$dom.style.padding = '6px 3px';

			return notify($dom);
		}

		$notifier.appendChild($node);

		if (document.body && !$notifier.parentNode) {
			document.body.appendChild($notifier);
		}

		setTimeout(function() {
			setTimeout(function() {
				$notifier.removeChild($node);

				if ($notifier.children.length===0 && $notifier.parentNode) {
					$notifier.parentNode.removeChild($notifier);
				}
			}, 2000);
		}, 0);
	}
}
