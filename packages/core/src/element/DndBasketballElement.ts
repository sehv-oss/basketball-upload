import { PHYSICS } from '../game/config.ts';
import { courtFromRects, rimCenter, type Court } from '../game/court.ts';
import type { Vec } from '../game/vector.ts';
import { assertFileType, resolveFileType } from '../file-types/registry.ts';
import type { FileType, ResolvedFileType } from '../file-types/types.ts';
import { matchesAccept } from '../upload/accept.ts';
import { DEFAULT_CONCURRENCY, UploadQueue } from '../upload/UploadQueue.ts';
import type { UploadItem, Uploader } from '../upload/types.ts';
import { ShotController } from './controllers/ShotController.ts';
import { el } from './dom.ts';
import {
  defaultMessages,
  type Messages,
  type RejectReason,
} from './messages.ts';
import {
  play,
  poseStyle,
  prefersReducedMotion,
  uprightOf,
  type Pose,
} from './motion.ts';
import { getStyleSheet } from './styles/styles.ts';
import { createCard, type CardView } from './views/card.ts';
import { createHeader } from './views/header.ts';
import { createHoop } from './views/hoop.ts';
import { createLiveRegion } from './views/live-region.ts';
import { createTrajectory } from './views/trajectory.ts';
import { createUploadList, type UploadListView } from './views/upload-list.ts';

export type Theme = 'light' | 'dark' | 'system';

export type ShotResult = 'score' | 'miss';

/** `CustomEvent`s dispatched by `<dnd-basketball>`, keyed by event name. They bubble. */
export interface DndBasketballEventMap {
  'file-reject': CustomEvent<{ file: File; reason: RejectReason }>;
  shot: CustomEvent<{ file: File; result: ShotResult }>;
  'upload-start': CustomEvent<{ item: UploadItem }>;
  'upload-progress': CustomEvent<{ item: UploadItem }>;
  'upload-success': CustomEvent<{ item: UploadItem }>;
  'upload-error': CustomEvent<{ item: UploadItem }>;
  change: CustomEvent<{ items: readonly UploadItem[] }>;
}

type State =
  | 'dragging'
  | 'drop-target'
  | 'aiming'
  | 'flying'
  | 'scoring'
  | 'rejected'
  | 'disabled';

/** Cards drawn on the court: the top one and two underneath. */
const VISIBLE_STACK = 3;
/** Delay between the cards of a multi-file dunk, ms. */
const DUNK_STAGGER = 150;

/**
 * `HTMLElement` is missing where there is no DOM (SSR). Extending a stand-in
 * keeps this module importable there; the class is only ever instantiated by
 * `customElements.define`, which those environments do not have either.
 */
const BaseElement: typeof HTMLElement =
  typeof HTMLElement === 'undefined'
    ? (class {} as unknown as typeof HTMLElement)
    : HTMLElement;

function hasFiles(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes('Files') ?? false;
}

function numberAttribute(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

/**
 * `<dnd-basketball>`: a file upload where the dropzone is a backboard. Drop
 * files on it, or drop them on the court and take the shot.
 */
export class DndBasketballElement extends BaseElement {
  static readonly formAssociated = true;
  static readonly observedAttributes = [
    'concurrency',
    'disabled',
    'name',
    'required',
  ] as const;

  readonly #internals: ElementInternals | null;
  readonly #queue = new UploadQueue();
  readonly #header = createHeader();
  readonly #hoop = createHoop();
  readonly #trajectory = createTrajectory();
  readonly #live = createLiveRegion();
  readonly #list: UploadListView;
  readonly #layer: HTMLElement;
  readonly #court: HTMLElement;
  readonly #spot: HTMLElement;
  readonly #input: HTMLInputElement;
  readonly #shots: ShotController;

  /** Cards waiting on the court, bottom of the stack first. */
  #staged: CardView[] = [];
  /** Cards on their way into the basket: dunks, shots in the air, scores. */
  readonly #inPlay = new Set<CardView>();
  #messages: Messages = defaultMessages;
  #fileTypes: readonly FileType[] = [];
  #resizeObserver: ResizeObserver | null = null;
  #formDisabled = false;
  #changeSignature = '';

  readonly #states = {
    dragging: false,
    dropOverBoard: false,
    flightOverBoard: false,
    scoring: 0,
    aiming: false,
    flying: false,
    rejected: false,
  };
  #rejectedTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();
    this.#internals =
      typeof this.attachInternals === 'function'
        ? this.attachInternals()
        : null;

    this.#list = createUploadList({
      resolveType: (file) => this.#resolveType(file),
      onRetry: (id) => this.retryItem(id),
      locale: () => this.closest('[lang]')?.getAttribute('lang') ?? undefined,
    });

    this.#spot = el('div', { class: 'spot', 'aria-hidden': 'true' });
    this.#court = el('div', { class: 'court' }, [this.#spot]);
    this.#layer = el('div', { class: 'layer' }, [this.#trajectory.element]);
    this.#input = el('input', {
      type: 'file',
      hidden: '',
      tabindex: '-1',
      'aria-hidden': 'true',
    });

    const root = this.attachShadow({ mode: 'open' });
    root.adoptedStyleSheets = [getStyleSheet()];
    root.append(
      el('div', { class: 'frame', part: 'frame' }, [
        this.#header.element,
        this.#hoop.element,
        this.#court,
        this.#list.element,
        this.#layer,
      ]),
      this.#live.element,
      this.#input
    );

    this.#shots = new ShotController({
      trajectory: this.#trajectory,
      measure: () => this.#measure(),
      setAiming: (on) => this.#setState('aiming', on),
      setFlying: (on) => this.#setState('flying', on),
      setOverBoard: (on) => {
        this.#states.flightOverBoard = on;
        this.#syncStates();
      },
      launched: (card) => this.#launched(card),
      scored: (card, pose, court) => void this.#score(card, pose, court),
      missed: (card) => this.#missed(card),
    });

    this.#hoop.dropzone.addEventListener('click', () => this.openPicker());
    this.#input.addEventListener('change', () => {
      const files = [...(this.#input.files ?? [])];
      this.#input.value = '';
      if (this.instant) this.#dunk(files);
      else this.#stage(files);
    });

    this.addEventListener('dragenter', this.#handleDragOver);
    this.addEventListener('dragover', this.#handleDragOver);
    this.addEventListener('dragleave', this.#handleDragLeave);
    this.addEventListener('drop', this.#handleDrop);

    this.#queue.on('change', (items) => this.#handleItems(items));
    this.#queue.on('start', (item) => this.#emit('upload-start', { item }));
    this.#queue.on('progress', (item) =>
      this.#emit('upload-progress', { item })
    );
    this.#queue.on('success', (item) => {
      this.#emit('upload-success', { item });
      this.#live.announce(this.#messages.complete(item.file.name));
    });
    this.#queue.on('error', (item) => {
      this.#emit('upload-error', { item });
      this.#live.announce(this.#messages.error(item.file.name));
    });

    this.#applyMessages();
    this.#syncForm();
  }

  // Properties

  get theme(): Theme {
    const value = this.getAttribute('theme');
    return value === 'light' || value === 'dark' ? value : 'system';
  }

  set theme(value: Theme | null | undefined) {
    if (value === 'light' || value === 'dark')
      this.setAttribute('theme', value);
    else this.removeAttribute('theme');
  }

  /** Accepted files, with the syntax of `<input type="file" accept>`. */
  get accept(): string {
    return this.getAttribute('accept') ?? '';
  }

  set accept(value: string | null | undefined) {
    if (value) this.setAttribute('accept', value);
    else this.removeAttribute('accept');
  }

  /** Several files at a time. Without it, a new file replaces the previous one. */
  get multiple(): boolean {
    return this.hasAttribute('multiple');
  }

  set multiple(value: boolean | null | undefined) {
    this.toggleAttribute('multiple', Boolean(value));
  }

  /** Largest accepted file, in bytes. */
  get maxSize(): number | null {
    return numberAttribute(this.getAttribute('max-size'));
  }

  set maxSize(value: number | null | undefined) {
    if (value === null || value === undefined) this.removeAttribute('max-size');
    else this.setAttribute('max-size', String(value));
  }

  /** Most files at once, staged and in the basket. */
  get maxFiles(): number | null {
    return numberAttribute(this.getAttribute('max-files'));
  }

  set maxFiles(value: number | null | undefined) {
    if (value === null || value === undefined)
      this.removeAttribute('max-files');
    else this.setAttribute('max-files', String(value));
  }

  /** Form field the files are submitted under. */
  get name(): string {
    return this.getAttribute('name') ?? '';
  }

  set name(value: string | null | undefined) {
    if (value) this.setAttribute('name', value);
    else this.removeAttribute('name');
  }

  get required(): boolean {
    return this.hasAttribute('required');
  }

  set required(value: boolean | null | undefined) {
    this.toggleAttribute('required', Boolean(value));
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean | null | undefined) {
    this.toggleAttribute('disabled', Boolean(value));
  }

  /** No shooting: every file goes straight into the basket. */
  get instant(): boolean {
    return this.hasAttribute('instant');
  }

  set instant(value: boolean | null | undefined) {
    this.toggleAttribute('instant', Boolean(value));
  }

  /** Uploads running at the same time. */
  get concurrency(): number {
    return this.#queue.concurrency;
  }

  set concurrency(value: number | null | undefined) {
    if (value === null || value === undefined)
      this.removeAttribute('concurrency');
    else this.setAttribute('concurrency', String(value));
  }

  /** Sends each file in the basket. Without one, files only travel with their form. */
  get uploader(): Uploader | null {
    return this.#queue.uploader;
  }

  set uploader(value: Uploader | null | undefined) {
    this.#queue.uploader = value ?? null;
  }

  get messages(): Messages {
    return this.#messages;
  }

  /** Copy overrides, merged over the defaults. */
  set messages(value: Partial<Messages> | null | undefined) {
    this.#messages = { ...defaultMessages, ...value };
    this.#applyMessages();
  }

  /** File types for this element only, checked before the registered ones. */
  get fileTypes(): readonly FileType[] {
    return this.#fileTypes;
  }

  set fileTypes(value: readonly FileType[] | null | undefined) {
    const types = value ?? [];
    types.forEach(assertFileType);
    this.#fileTypes = types;
  }

  /** Files in the basket and their uploads. */
  get items(): readonly UploadItem[] {
    return this.#queue.items;
  }

  /** Files in the basket: the value submitted with the form. */
  get files(): readonly File[] {
    return this.#queue.items.map((item) => item.file);
  }

  get form(): HTMLFormElement | null {
    return this.#internals?.form ?? null;
  }

  get validity(): ValidityState | undefined {
    return this.#internals?.validity;
  }

  get validationMessage(): string {
    return this.#internals?.validationMessage ?? '';
  }

  get willValidate(): boolean {
    return this.#internals?.willValidate ?? false;
  }

  checkValidity(): boolean {
    return this.#internals?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    return this.#internals?.reportValidity() ?? true;
  }

  // Methods

  /** Opens the file picker. The chosen files land on the court (or in the basket, with `instant`). */
  openPicker(): void {
    if (this.#isDisabled) return;
    this.#input.accept = this.accept;
    this.#input.multiple = this.multiple;
    this.#input.click();
  }

  /** Puts files on the court, ready to be shot. */
  stage(files: Iterable<File>): void {
    if (this.instant) this.#dunk([...files]);
    else this.#stage([...files]);
  }

  /** Puts files straight into the basket. */
  dunk(files: Iterable<File>): void {
    this.#dunk([...files]);
  }

  /** Shoots the card on top of the court with a perfect shot. */
  shoot(): boolean {
    const card = this.#staged.at(-1);
    return card !== undefined && !this.#isDisabled && this.#shots.shoot(card);
  }

  /** Uploads a failed file again. */
  retryItem(id: string): boolean {
    return this.#queue.retry(id);
  }

  /** Takes a file out of the basket, aborting its upload. */
  removeItem(id: string): boolean {
    return this.#queue.remove(id);
  }

  /** Empties the court and the basket, aborting uploads. */
  clear(): void {
    const card = this.#shots.stop();
    card?.dispose();
    for (const staged of this.#staged) staged.dispose();
    for (const playing of this.#inPlay) playing.dispose();
    this.#staged = [];
    this.#inPlay.clear();
    this.#states.scoring = 0;
    this.#syncStates();
    this.#queue.clear();
  }

  // Lifecycle

  connectedCallback(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.#resizeObserver = new ResizeObserver(() => this.#syncRest());
      this.#resizeObserver.observe(this.#court);
      this.#resizeObserver.observe(this.#layer);
    }
    this.#syncRest();
    this.#applyDisabled();
  }

  disconnectedCallback(): void {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    const card = this.#shots.stop();
    if (card && !this.#staged.includes(card)) {
      this.#inPlay.delete(card);
      card.release();
      this.#staged.push(card);
      this.#renderStack();
    }
  }

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    value: string | null
  ): void {
    switch (name) {
      case 'concurrency':
        this.#queue.concurrency = numberAttribute(value) ?? DEFAULT_CONCURRENCY;
        break;
      case 'disabled':
        this.#applyDisabled();
        break;
      case 'name':
      case 'required':
        this.#syncForm();
        break;
      default:
        break;
    }
  }

  formResetCallback(): void {
    this.clear();
  }

  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.#applyDisabled();
  }

  // Internals

  get #isDisabled(): boolean {
    return this.disabled || this.#formDisabled;
  }

  #emit<K extends keyof DndBasketballEventMap>(
    type: K,
    detail: DndBasketballEventMap[K]['detail']
  ): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true }));
  }

  #resolveType(file: File): ResolvedFileType {
    return resolveFileType(file, this.#fileTypes);
  }

  #setState(name: 'aiming' | 'flying', on: boolean): void {
    this.#states[name] = on;
    this.#syncStates();
  }

  #toggleState(name: State, on: boolean): void {
    const states = this.#internals?.states;
    if (!states) return;
    try {
      if (on) states.add(name);
      else states.delete(name);
    } catch {
      // CustomStateSet without plain identifiers (Chrome < 125): styling only.
    }
  }

  #syncStates(): void {
    const s = this.#states;
    this.#toggleState('dragging', s.dragging);
    this.#toggleState(
      'drop-target',
      (s.dragging && s.dropOverBoard) || s.flightOverBoard || s.scoring > 0
    );
    this.#toggleState('aiming', s.aiming);
    this.#toggleState('flying', s.flying);
    this.#toggleState('scoring', s.scoring > 0);
    this.#toggleState('rejected', s.rejected);
    this.#toggleState('disabled', this.#isDisabled);
  }

  #applyMessages(): void {
    this.#header.update(this.#messages);
    this.#hoop.update(this.#messages);
    this.#list.render(this.#queue.items, this.#messages);
    for (const card of this.#staged) {
      card.element.setAttribute(
        'aria-label',
        this.#messages.shoot(card.file.name)
      );
    }
    this.#syncForm();
  }

  #applyDisabled(): void {
    const disabled = this.#isDisabled;
    this.#hoop.dropzone.disabled = disabled;
    if (this.#internals)
      this.#internals.ariaDisabled = disabled ? 'true' : null;
    if (disabled) this.#shots.cancelAim();
    this.#renderStack();
    this.#syncStates();
  }

  /** Validates incoming files; rejected ones are reported, accepted ones returned. */
  #admit(files: readonly File[]): File[] {
    if (this.#isDisabled) return [];
    const max = this.multiple ? (this.maxFiles ?? Infinity) : 1;
    const used = this.multiple
      ? this.#queue.items.length + this.#staged.length + this.#inPlay.size
      : 0;
    const maxSize = this.maxSize;
    const accepted: File[] = [];

    for (const file of files) {
      let reason: RejectReason | null = null;
      if (!matchesAccept(file, this.accept)) reason = 'type';
      else if (maxSize !== null && file.size > maxSize) reason = 'size';
      else if (used + accepted.length >= max) reason = 'count';

      if (reason) this.#reject(file, reason);
      else accepted.push(file);
    }

    // Like `<input type="file">` without `multiple`: a new file replaces the old one.
    if (!this.multiple && accepted.length > 0) this.clear();
    return accepted;
  }

  #reject(file: File, reason: RejectReason): void {
    this.#emit('file-reject', { file, reason });
    this.#live.announce(this.#messages.rejected(file.name, reason));
    this.#states.rejected = true;
    this.#syncStates();
    clearTimeout(this.#rejectedTimer);
    this.#rejectedTimer = setTimeout(() => {
      this.#states.rejected = false;
      this.#syncStates();
    }, 450);
  }

  #createCard(file: File): CardView {
    const card = createCard(
      file,
      this.#resolveType(file),
      this.#messages.shoot(file.name)
    );
    const { element } = card;
    element.addEventListener('pointerdown', (event) => {
      if (this.#isDisabled || !this.#staged.includes(card)) return;
      this.#shots.grab(card, event);
    });
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.#shots.cancelAim();
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!this.#isDisabled && this.#staged.at(-1) === card)
        this.#shots.shoot(card);
    });
    // Shots happen on pointer and key events; a click alone does nothing.
    element.addEventListener('click', (event) => event.preventDefault());
    return card;
  }

  #stage(files: readonly File[], clientPoint?: Vec): void {
    const accepted = this.#admit(files);
    if (accepted.length === 0) return;

    const origin = clientPoint ? this.#toLayer(clientPoint) : null;
    for (const file of accepted) {
      const card = this.#createCard(file);
      this.#staged.push(card);
      this.#layer.append(card.element);
    }
    this.#renderStack();

    if (!origin || prefersReducedMotion()) return;
    // Cards dropped on the court slide from where they were dropped.
    for (const card of this.#staged.slice(-accepted.length)) {
      const rest = card.element.getBoundingClientRect();
      const layer = this.#layer.getBoundingClientRect();
      const dx = origin.x - (rest.left - layer.left + rest.width / 2);
      const dy = origin.y - (rest.top - layer.top + rest.height / 2);
      void play(
        card.element,
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
  }

  #dunk(files: readonly File[], clientPoint?: Vec): void {
    const accepted = this.#admit(files);
    accepted.forEach((file, index) => {
      const card = this.#createCard(file);
      card.element.tabIndex = -1;
      card.element.inert = true;
      this.#inPlay.add(card);
      this.#layer.append(card.element);
      setTimeout(
        () => void this.#runDunk(card, clientPoint),
        index * DUNK_STAGGER
      );
    });
  }

  async #runDunk(card: CardView, clientPoint?: Vec): Promise<void> {
    if (!this.#inPlay.has(card)) return;
    const court = this.#measure();
    if (!court) {
      // Not rendered: no hoop to dunk on, the file still goes in.
      this.#inPlay.delete(card);
      card.dispose();
      this.#queue.add(card.file);
      return;
    }

    const center = rimCenter(court);
    const start = clientPoint
      ? this.#toLayer(clientPoint)
      : { x: center.x, y: court.board.y + court.board.height * 0.3 };
    const from: Pose = { ...start, rotation: -10, scale: 0.9 };
    const above: Pose = {
      x: center.x,
      y: court.square.y + court.square.height * 0.35,
      rotation: 6,
      scale: PHYSICS.depthScale,
    };
    card.place(from);
    this.#states.scoring += 1;
    this.#syncStates();

    if (!prefersReducedMotion()) {
      const { width, height } = card.size();
      await play(
        card.element,
        [poseStyle(from, width, height), poseStyle(above, width, height)],
        {
          duration: 320,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          commit: true,
        }
      );
    }
    // `clear()` may have emptied the basket meanwhile; it reset the states.
    if (!this.#inPlay.has(card)) return;
    this.#states.scoring -= 1;
    await this.#score(card, above, court);
  }

  #launched(card: CardView): void {
    const hadFocus = this.shadowRoot?.activeElement === card.element;
    this.#staged = this.#staged.filter((staged) => staged !== card);
    this.#inPlay.add(card);
    card.element.inert = true;
    this.#renderStack();
    if (hadFocus) {
      (this.#staged.at(-1)?.element ?? this.#hoop.dropzone).focus();
    }
  }

  #missed(card: CardView): void {
    if (!this.#inPlay.delete(card)) return;
    card.element.inert = false;
    this.#staged.push(card);
    this.#renderStack();
    this.#emit('shot', { file: card.file, result: 'miss' });
    this.#live.announce(this.#messages.missed(card.file.name));
  }

  /**
   * Through the net, then into the basket: the "+1", the counter and the
   * upload only come once the card is out of the net, as in the design.
   */
  async #score(card: CardView, from: Pose, court: Court): Promise<void> {
    if (!this.#inPlay.has(card)) return;
    const reduced = prefersReducedMotion();
    this.#states.scoring += 1;
    this.#syncStates();

    if (!reduced) {
      const { width, height } = card.size();
      const below: Pose = {
        x: rimCenter(court).x,
        y: court.netBottom + (height * PHYSICS.depthScale) / 2 - height * 0.06,
        rotation: uprightOf(from.rotation),
        scale: PHYSICS.depthScale,
      };
      this.#hoop.swish();
      await play(
        card.element,
        [poseStyle(from, width, height), poseStyle(below, width, height)],
        {
          duration: 600,
          easing: 'cubic-bezier(0.45, 0, 0.7, 0.6)',
          commit: true,
        }
      );
    }
    // `clear()` may have emptied the basket meanwhile; it reset the states.
    if (!this.#inPlay.has(card)) return;

    this.#states.scoring -= 1;
    this.#syncStates();
    this.#hoop.celebrate(reduced);
    this.#queue.add(card.file);
    this.#emit('shot', { file: card.file, result: 'score' });
    this.#live.announce(this.#messages.scored(card.file.name));

    await play(
      card.element,
      [
        { opacity: 1 },
        { opacity: 0.6, offset: 0.2 },
        { opacity: 0.6, offset: 0.6 },
        { opacity: 0 },
      ],
      { duration: reduced ? 240 : 1200, commit: true }
    );
    this.#inPlay.delete(card);
    card.dispose();
  }

  #renderStack(): void {
    const top = this.#staged.length - 1;
    this.#staged.forEach((card, index) => {
      const depth = top - index;
      const { element } = card;
      element.dataset.depth = depth < VISIBLE_STACK ? String(depth) : 'hidden';
      element.style.zIndex = String(index + 1);
      const interactive = depth === 0 && !this.#isDisabled;
      element.inert = !interactive;
      element.tabIndex = interactive ? 0 : -1;
    });
  }

  #handleItems(items: readonly UploadItem[]): void {
    this.#list.render(items, this.#messages);
    this.#header.setCount(items.length, !prefersReducedMotion());
    this.#syncForm();

    // `change` follows the basket and the status of its files, not progress.
    const signature = items.map((item) => `${item.id}:${item.status}`).join();
    if (signature === this.#changeSignature) return;
    this.#changeSignature = signature;
    this.#emit('change', { items });
  }

  #syncForm(): void {
    const internals = this.#internals;
    if (!internals) return;
    const files = this.files;
    const name = this.name;

    if (name && files.length > 0) {
      const data = new FormData();
      for (const file of files) data.append(name, file);
      internals.setFormValue(data);
    } else {
      internals.setFormValue(null);
    }

    if (this.required && files.length === 0) {
      internals.setValidity(
        { valueMissing: true },
        this.#messages.required,
        this.#hoop.dropzone
      );
    } else {
      internals.setValidity({});
    }
  }

  /** Converts client coordinates to the card layer's. */
  #toLayer(point: Vec): Vec {
    const layer = this.#layer.getBoundingClientRect();
    return { x: point.x - layer.left, y: point.y - layer.top };
  }

  #measure(): Court | null {
    const host = this.#layer.getBoundingClientRect();
    if (host.width === 0 || host.height === 0) return null;
    const court = courtFromRects({
      host,
      board: this.#hoop.dropzone.getBoundingClientRect(),
      square: this.#hoop.square.getBoundingClientRect(),
      rim: this.#hoop.rim.getBoundingClientRect(),
      net: this.#hoop.net.getBoundingClientRect(),
      spot: this.#spot.getBoundingClientRect(),
    });
    return court.unit > 0 ? court : null;
  }

  /** Publishes where staged cards rest, for the CSS that draws them there. */
  #syncRest(): void {
    const layer = this.#layer.getBoundingClientRect();
    const spot = this.#spot.getBoundingClientRect();
    if (layer.width === 0) return;
    const x = spot.left - layer.left + spot.width / 2;
    const y = spot.top - layer.top + spot.height / 2;
    this.#layer.style.setProperty('--_rest-x', `${x}px`);
    this.#layer.style.setProperty('--_rest-y', `${y}px`);
  }

  #isOverBoard(point: Vec): boolean {
    const board = this.#hoop.dropzone.getBoundingClientRect();
    return (
      point.x >= board.left &&
      point.x <= board.right &&
      point.y >= board.top &&
      point.y <= board.bottom
    );
  }

  readonly #handleDragOver = (dragEvent: Event): void => {
    const event = dragEvent as DragEvent;
    if (!hasFiles(event)) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.#isDisabled ? 'none' : 'copy';
    }
    if (this.#isDisabled) return;
    this.#states.dragging = true;
    this.#states.dropOverBoard = this.#isOverBoard({
      x: event.clientX,
      y: event.clientY,
    });
    this.#syncStates();
  };

  readonly #handleDragLeave = (dragEvent: Event): void => {
    const event = dragEvent as DragEvent;
    const box = this.getBoundingClientRect();
    const inside =
      event.clientX > box.left &&
      event.clientX < box.right &&
      event.clientY > box.top &&
      event.clientY < box.bottom;
    if (inside) return;
    this.#states.dragging = false;
    this.#states.dropOverBoard = false;
    this.#syncStates();
  };

  readonly #handleDrop = (dragEvent: Event): void => {
    const event = dragEvent as DragEvent;
    if (!hasFiles(event)) return;
    event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    const overBoard = this.#isOverBoard(point);
    this.#states.dragging = false;
    this.#states.dropOverBoard = false;
    this.#syncStates();

    const files = [...(event.dataTransfer?.files ?? [])];
    if (overBoard || this.instant) this.#dunk(files, point);
    else this.#stage(files, point);
  };
}

// Typed `addEventListener` for the events dispatched above.
export interface DndBasketballElement {
  addEventListener<K extends keyof DndBasketballEventMap>(
    type: K,
    listener: (
      this: DndBasketballElement,
      event: DndBasketballEventMap[K]
    ) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof DndBasketballEventMap>(
    type: K,
    listener: (
      this: DndBasketballElement,
      event: DndBasketballEventMap[K]
    ) => void,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'dnd-basketball': DndBasketballElement;
  }
}
