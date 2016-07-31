
import { loadData } from '../loader/scripts'


/**
 * @param {Element}
 * @param {function}
 */
export default function resolveDataAttribute($element, attrName, fn)
{
	($element.getAttribute(attrName)||'').split('$').filter(attrValue => attrValue).map(function(attrValue) {
		let [attrPlugin, ...pvar] = attrValue.split(':');

		const matched = attrPlugin.match(/^(?:([^\[]*)(?:\[([^\]]*)\])?@)?(([^\[]*)(?:\[([^\]]*)\])?)$/);
		const target = matched[1]||'';
		const targetId = matched[2]||'';
		const name = matched[3] + (matched[5]===undefined ? "[]" : "");
		const pluginName = matched[4];
		const pluginId = matched[5]||'';
		const data = loadData(pvar.join(':') || null)

		fn({ pluginName, pluginId, target, targetId, name, data });
	});
}
