export function createElement<TTagName extends keyof HTMLElementTagNameMap>(
  tag: TTagName,
  attributes: Record<string, string> = {},
  children: readonly (Node | string)[] = []
): HTMLElementTagNameMap[TTagName] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  element.append(...children);
  return element;
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export function createSvgElement<TTagName extends keyof SVGElementTagNameMap>(
  tag: TTagName,
  attributes: Record<string, string | number> = {},
  children: readonly SVGElement[] = []
): SVGElementTagNameMap[TTagName] {
  const element = document.createElementNS(SVG_NAMESPACE, tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, String(value));
  }
  element.append(...children);
  return element;
}

const icons = {
  upload:
    'M12 15V4.5m0 0L8 8.5m4-4 4 4M5 14v3.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V14',
  check: 'M7.5 12.5l3 3 6-6.5',
  retry: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
} as const;

export type IconName = keyof typeof icons;

/**
 * A 24×24 stroked icon, hidden from assistive technology.
 */
export function icon(
  name: IconName,
  attributes: Record<string, string> = {}
): SVGSVGElement {
  return createSvgElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      'aria-hidden': 'true',
      focusable: 'false',
      class: 'icon',
      ...attributes,
    },
    [createSvgElement('path', { d: icons[name] })]
  );
}

/**
 * Replaces the children of a slot: its fallback content.
 */
export function setFallback(slot: HTMLSlotElement, text: string): void {
  if (slot.textContent !== text) slot.textContent = text;
}
