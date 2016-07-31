

/**
 * @param {Element=}
 * @param {Element=}
 * @return {boolean}
 * see: Closure Library - goog.dom.contains
 */
export default function contains(parent, descendant) {
  // We use browser specific methods for this if available since it is faster
  // that way.

  // IE DOM
  if (parent.contains && descendant.nodeType == 1) {
    return parent == descendant || parent.contains(descendant);
  }

  // W3C DOM Level 3
  if (typeof parent.compareDocumentPosition != 'undefined') {
    return parent == descendant ||
        Boolean(parent.compareDocumentPosition(descendant) & 16);
  }

  // W3C DOM Level 1
  while (descendant && parent != descendant) {
    descendant = descendant.parentNode;
  }
  return descendant == parent;
}
