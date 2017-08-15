

export function destroyPlugin({ instance={}, pluginApi }, partial=false) {
	pluginApi && pluginApi.destroy(partial);
	destroy(instance, partial);
}


export function destroy(instance, partial=false) {
	if (instance) {
		if (typeof instance.destroy==='function') {
			instance.destroy(partial);

		} else if (typeof instance.destroy==='object') {
			instance.destroy.forEach(destroy => destroy(partial));

		} else if (typeof instance==='function') {
			instance(partial);
		}
	}
}
