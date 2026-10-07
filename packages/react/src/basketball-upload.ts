import {
  createElement,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react';

import {
  DEFAULT_TAG_NAME,
  registerBasketballUpload,
  type BasketballUploadElement,
  type BasketballUploadEventMap,
  type FileType,
  type Messages,
  type Theme,
  type Uploader,
} from '@sehv-oss/basketball-upload';

type Detail<TType extends keyof BasketballUploadEventMap> =
  BasketballUploadEventMap[TType]['detail'];

/**
 * Props of `<BasketballUpload>`: the attributes and properties of the element,
 * and its events as callbacks.
 */
export interface BasketballUploadProps {
  /**
   * The `<basketball-upload>` element, for its methods and properties.
   */
  ref?: Ref<BasketballUploadElement> | undefined;

  /**
   * Defaults to `system`.
   */
  theme?: Theme | undefined;

  /**
   * Accepted files, with the syntax of `<input type="file" accept>`.
   */
  accept?: string | undefined;

  /**
   * Several files at a time. Without it, a new file replaces the previous one.
   */
  multiple?: boolean | undefined;

  /**
   * Largest accepted file, in bytes.
   */
  maxSize?: number | undefined;

  /**
   * Most files at once, staged and in the basket.
   */
  maxFiles?: number | undefined;

  /**
   * Form field the files are submitted under.
   */
  name?: string | undefined;

  /**
   * The form is invalid while the basket is empty.
   */
  required?: boolean | undefined;

  /**
   * Ignores files and shots.
   */
  disabled?: boolean | undefined;

  /**
   * No shooting: every file goes straight into the basket.
   */
  instant?: boolean | undefined;

  /**
   * Uploads running at the same time. Defaults to 3.
   */
  concurrency?: number | undefined;

  /**
   * Sends each file. Keep it stable (module scope or `useCallback`).
   */
  uploader?: Uploader | null | undefined;

  /**
   * Copy overrides. Memoize them: a new object re-renders the copy.
   */
  messages?: Partial<Messages> | undefined;

  /**
   * File types for this element. Memoize them, like `messages`.
   */
  fileTypes?: readonly FileType[] | undefined;

  /**
   * Name the custom element was registered with, when not the default.
   */
  tagName?: string | undefined;

  /**
   * Set on the element.
   */
  id?: string | undefined;

  /**
   * Set on the element, as `class`.
   */
  className?: string | undefined;

  /**
   * Set on the element, custom properties (`--basketball-upload-*`) included.
   */
  style?: CSSProperties | undefined;

  /**
   * Slotted content, such as `<span slot="title">`.
   */
  children?: ReactNode | undefined;

  /**
   * A file did not pass `accept`, `maxSize` or `maxFiles`. Gets the `detail` of the `file-reject` event, not the event.
   */
  onFileReject?: ((detail: Detail<'file-reject'>) => void) | undefined;

  /**
   * A card went through the net, dunks included, or a shot missed. Gets the `detail` of the `shot` event.
   */
  onShot?: ((detail: Detail<'shot'>) => void) | undefined;

  /**
   * The uploader was called for an item. Gets the `detail` of the `upload-start` event.
   */
  onUploadStart?: ((detail: Detail<'upload-start'>) => void) | undefined;

  /**
   * The uploader reported progress. Gets the `detail` of the `upload-progress` event.
   */
  onUploadProgress?: ((detail: Detail<'upload-progress'>) => void) | undefined;

  /**
   * An upload resolved; `item.response` has its value. Gets the `detail` of the `upload-success` event.
   */
  onUploadSuccess?: ((detail: Detail<'upload-success'>) => void) | undefined;

  /**
   * An upload rejected; `item.error` has the reason. Gets the `detail` of the `upload-error` event.
   */
  onUploadError?: ((detail: Detail<'upload-error'>) => void) | undefined;

  /**
   * Files entered or left the basket, or one changed status. Gets the `detail` of the `change` event.
   */
  onChange?: ((detail: Detail<'change'>) => void) | undefined;
}

type Callbacks = Pick<
  BasketballUploadProps,
  | 'onFileReject'
  | 'onShot'
  | 'onUploadStart'
  | 'onUploadProgress'
  | 'onUploadSuccess'
  | 'onUploadError'
  | 'onChange'
>;

const EVENTS: { [TType in keyof BasketballUploadEventMap]: keyof Callbacks } = {
  'file-reject': 'onFileReject',
  shot: 'onShot',
  'upload-start': 'onUploadStart',
  'upload-progress': 'onUploadProgress',
  'upload-success': 'onUploadSuccess',
  'upload-error': 'onUploadError',
  change: 'onChange',
};

/**
 * `<basketball-upload>` for React 19. Plain values travel as attributes, which
 * the server renders and the client upgrades; functions and objects
 * (`uploader`, `messages`, `fileTypes`) and the event callbacks are applied to
 * the element after it mounts.
 */
export function BasketballUpload(props: BasketballUploadProps): ReactNode {
  const {
    ref,
    theme,
    accept,
    multiple,
    maxSize,
    maxFiles,
    name,
    required,
    disabled,
    instant,
    concurrency,
    uploader,
    messages,
    fileTypes,
    tagName = DEFAULT_TAG_NAME,
    children,

    onFileReject,
    onShot,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    onChange,

    ...rest
  } = props;

  registerBasketballUpload({ tagName });

  const elementRef = useRef<BasketballUploadElement>(null);
  useImperativeHandle(
    ref,
    () => elementRef.current as BasketballUploadElement,
    []
  );

  const callbacks = useRef<Callbacks>({});
  callbacks.current = {
    onFileReject,
    onShot,
    onUploadStart,
    onUploadProgress,
    onUploadSuccess,
    onUploadError,
    onChange,
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const listeners = new AbortController();
    for (const [type, callback] of Object.entries(EVENTS)) {
      element.addEventListener(
        type,
        (event) => {
          const handle = callbacks.current[callback] as
            ((detail: unknown) => void) | undefined;
          handle?.((event as CustomEvent).detail);
        },
        { signal: listeners.signal }
      );
    }

    return () => listeners.abort();
  }, []);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) element.uploader = uploader ?? null;
  }, [uploader]);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) element.messages = messages;
  }, [messages]);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element) element.fileTypes = fileTypes;
  }, [fileTypes]);

  return createElement(
    tagName,
    {
      ...rest,
      ref: elementRef,
      theme: theme === 'light' || theme === 'dark' ? theme : undefined,
      accept: accept || undefined,
      multiple: multiple || undefined,
      'max-size': maxSize,
      'max-files': maxFiles,
      name: name || undefined,
      required: required || undefined,
      disabled: disabled || undefined,
      instant: instant || undefined,
      concurrency,
    },
    children
  );
}
