

export default function create(module) {
	if (module.hot) {
		module.hot.accept();
	}

	return function hotReload(binder, name, plugin, _export='default') {
		binder(name, __webpack_require__(plugin)[_export]);

		if (module.hot) {
			module.hot.accept(plugin, function() {
				binder(name, __webpack_require__(plugin)[_export]);
			});
		}
	}
}
