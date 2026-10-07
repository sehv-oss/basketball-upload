import type { Messages } from '@sehv-oss/basketball-upload';

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

export const spanishMessages: Partial<Messages> = {
  title: 'Subir archivos',
  description: 'Arrastra y suelta, o lanza a canasta.',
  prompt: 'Suelta los archivos aquí',
  hint: 'o lanza a canasta',
  dropzone: 'Elegir archivos para subir',
  counter: 'Subidos',
  shoot: (name) => `Lanzar ${name}`,
  ready: 'Listo',
  queued: 'En cola…',
  uploading: 'Subiendo…',
  uploaded: 'Subido',
  failed: 'Error al subir',
  retry: (name) => `Volver a subir ${name}`,
  progress: (name) => `Progreso de subida de ${name}`,
  required: 'Añade al menos un archivo.',
  scored: (name) => `${name}: ¡canasta!`,
  missed: (name) => `Tiro fallido: ${name}. Lanza de nuevo.`,
  rejected: (name, reason) =>
    reason === 'type'
      ? `${name} no es de un tipo aceptado.`
      : reason === 'size'
        ? `${name} es demasiado grande.`
        : `${name} supera el límite de archivos.`,
  complete: (name) => `${name} subido.`,
  error: (name) => `No se pudo subir ${name}.`,
};
