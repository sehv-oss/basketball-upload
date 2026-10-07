import card from './card.css';
import hoop from './hoop.css';
import layers from './layers.css';
import layout from './layout.css';
import list from './list.css';
import motion from './motion.css';
import reset from './reset.css';
import states from './states.css';
import tokens from './tokens.css';

const SOURCES = [
  layers,
  tokens,
  reset,
  layout,
  hoop,
  card,
  list,
  states,
  motion,
];

let sheet: CSSStyleSheet | undefined;

/**
 * One constructed stylesheet shared by every element, created on first use rather than at module evaluation:
 * the module must be importable where `CSSStyleSheet` does not exist (SSR).
 */
export function getStyleSheet(): CSSStyleSheet {
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(SOURCES.join('\n'));
  }
  return sheet;
}
