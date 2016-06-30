
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
	if (parentModule.hot) {
		parentModule.hot.accept();
	}

	return function hotReload(binder, name, plugin, _export='default') {
		binder(name, __webpack_require__(plugin)[_export]);

		if (module.hot) {
			module.hot.accept(plugin, function() {
				const $update = document.createElement('div');
				$update.textContent = "Plugin '" + name + "' update detected. Reloading..";
				$update.style.padding = '6px 3px';
				$notifier.appendChild($update);

				if (document.body && !$notifier.parentNode) {
					document.body.appendChild($notifier);
				}

				try {
					binder(name, __webpack_require__(plugin)[_export]);
					$update.style.backgroundColor = "#33cc33";
					$update.textContent = "Plugin " + name + " reloaded.";

				} catch (e) {
					$update.style.backgroundColor = "#cc0000";
					$update.textContent = "Plugin " + name + " update failed ("+e.message+").";
					console.error(e, e.stack);
				}

				setTimeout(function() {
					$notifier.removeChild($update);

					if ($notifier.children.length===0 && $notifier.parentNode) {
						$notifier.parentNode.removeChild($notifier);
					}
				}, 2000);
			});
		}
	}
}
