

export function destroyPlugin({ instances=[], pluginApi }, partial=false) {
	pluginApi && pluginApi.destroy(partial);
	instances.forEach(instance => destroy(instance, partial));
}


export function destroy(instance, partial=false) {
	if (instance) {
		if (typeof instance.destroy==='function') {
			instance.destroy(partial);

		} else if (typeof instance.destroy==='object' && instance.destroy.length>0) {
			instance.destroy.forEach(destroy => destroy(partial));

		} else if (typeof instance==='function') {
			instance(partial);
		}
	}
}
