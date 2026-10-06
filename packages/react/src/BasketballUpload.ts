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

type Detail<K extends keyof BasketballUploadEventMap> =
  BasketballUploadEventMap[K]['detail'];

export interface BasketballUploadProps {
  /** The `<basketball-upload>` element, for its methods and properties. */
  ref?: Ref<BasketballUploadElement> | undefined;
  /** Defaults to `system`. */
  theme?: Theme | undefined;
  accept?: string | undefined;
  multiple?: boolean | undefined;
  /** Largest accepted file, in bytes. */
  maxSize?: number | undefined;
  /** Most files at once, staged and in the basket. */
  maxFiles?: number | undefined;
  /** Form field the files are submitted under. */
  name?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  /** No shooting: every file goes straight into the basket. */
  instant?: boolean | undefined;
  concurrency?: number | undefined;
  /** Sends each file. Keep it stable (module scope or `useCallback`). */
  uploader?: Uploader | null | undefined;
  /** Copy overrides. Memoize them: a new object re-renders the copy. */
  messages?: Partial<Messages> | undefined;
  /** File types for this element. Memoize them, like `messages`. */
  fileTypes?: readonly FileType[] | undefined;
  /** Name the custom element was registered with, when not the default. */
  tagName?: string | undefined;
  id?: string | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  /** Slotted content, such as `<span slot="title">`. */
  children?: ReactNode | undefined;
  onFileReject?: ((detail: Detail<'file-reject'>) => void) | undefined;
  onShot?: ((detail: Detail<'shot'>) => void) | undefined;
  onUploadStart?: ((detail: Detail<'upload-start'>) => void) | undefined;
  onUploadProgress?: ((detail: Detail<'upload-progress'>) => void) | undefined;
  onUploadSuccess?: ((detail: Detail<'upload-success'>) => void) | undefined;
  onUploadError?: ((detail: Detail<'upload-error'>) => void) | undefined;
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

const EVENTS: { [K in keyof BasketballUploadEventMap]: keyof Callbacks } = {
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
export function BasketballUpload({
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
  ...props
}: BasketballUploadProps): ReactNode {
  // Idempotent and SSR-safe. Done during render so the element is upgraded
  // as soon as React creates it, before any property is assigned.
  registerBasketballUpload({ tagName });

  const elementRef = useRef<BasketballUploadElement>(null);
  useImperativeHandle(
    ref,
    () => elementRef.current as BasketballUploadElement,
    []
  );

  // Listeners are added once and read the latest callbacks.
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

    const subscriptions = Object.entries(EVENTS).map(([type, callback]) => {
      const listener = (event: Event): void => {
        const handler = callbacks.current[callback] as
          ((detail: unknown) => void) | undefined;
        handler?.((event as CustomEvent).detail);
      };
      element.addEventListener(type, listener);
      return () => element.removeEventListener(type, listener);
    });

    return () => {
      for (const unsubscribe of subscriptions) unsubscribe();
    };
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
      ...props,
      ref: elementRef,
      // Kebab-case names are attributes on the server and on the client alike.
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
