import type { Messages } from '@sehv-oss/basketball-upload';

/** Brazilian Portuguese copy, to show the `messages` property at work. */
export const portugueseMessages: Partial<Messages> = {
  title: 'Enviar arquivos',
  description: 'Arraste e solte, ou arremesse.',
  prompt: 'Solte os arquivos aqui',
  hint: 'ou arremesse',
  dropzone: 'Escolher arquivos para enviar',
  counter: 'Enviados',
  shoot: (name) => `Arremessar ${name}`,
  ready: 'Pronto',
  queued: 'Na fila…',
  uploading: 'Enviando…',
  uploaded: 'Enviado',
  failed: 'Falha no envio',
  retry: (name) => `Enviar ${name} de novo`,
  progress: (name) => `Progresso do envio de ${name}`,
  required: 'Adicione pelo menos um arquivo.',
  scored: (name) => `${name}: cesta!`,
  missed: (name) => `Errou ${name}. Arremesse de novo.`,
  rejected: (name, reason) =>
    reason === 'type'
      ? `${name} não é de um tipo aceito.`
      : reason === 'size'
        ? `${name} é grande demais.`
        : `${name} passa do limite de arquivos.`,
  complete: (name) => `${name} enviado.`,
  error: (name) => `Falha ao enviar ${name}.`,
};
