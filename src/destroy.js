

export default function destroy({ instance={}, pluginApi }, partial=false) {
	pluginApi && pluginApi.destroy(partial);

	if (typeof instance.destroy === 'function') {
		instance.destroy(partial);

	} else if (typeof instance.destroy==='object') {
		instance.destroy.forEach(function(destroy) {
			destroy(partial);
		});
	}
}
