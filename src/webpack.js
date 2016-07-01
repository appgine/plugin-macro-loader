
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
	const loaders = [];

	setTimeout(function() {
		notify("Plugins have been loaded.");
	}, 0);

	if (parentModule.hot) {
		parentModule.hot.addDisposeHandler(function() {
			loaders.forEach(fn => fn());
			loaders.splice(0, loaders.length);
			notify("Plugins have been disposed.");
		});

		parentModule.hot.accept();
	}

	return function hotReload(binder, name, plugin, _export='default') {
		const pluginHotReload = binder(name, __webpack_require__(plugin)[_export]);
		loaders.push(pluginHotReload);

		if (module.hot) {
			module.hot.accept(plugin, function() {
				const $update = document.createElement('div');
				$update.textContent = "Plugin '" + name + "' update detected. Reloading..";
				$update.style.padding = '6px 3px';

				notify($update);

				try {
					pluginHotReload(__webpack_require__(plugin)[_export]);
					$update.style.backgroundColor = "#33cc33";
					$update.textContent = "Plugin " + name + " reloaded.";

				} catch (e) {
					$update.style.backgroundColor = "#cc0000";
					$update.textContent = "Plugin " + name + " update failed ("+e.message+").";
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
