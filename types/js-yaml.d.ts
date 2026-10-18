/**
 * Типы для js-yaml: пакет их не поставляет, а npm install в этом проекте
 * недоступен. Описано только то, чем пользуется post-schema.ts. Если в
 * devDependencies появится @types/js-yaml — этот файл нужно удалить.
 */
declare module 'js-yaml' {
  export type DumpOptions = {
    lineWidth?: number;
    noRefs?: boolean;
    quotingType?: '"' | "'";
    sortKeys?: boolean | ((a: string, b: string) => number);
    indent?: number;
    skipInvalid?: boolean;
  };

  export type LoadOptions = {
    schema?: unknown;
    json?: boolean;
  };

  export function dump(value: unknown, options?: DumpOptions): string;
  export function load(text: string, options?: LoadOptions): unknown;

  const yaml: { dump: typeof dump; load: typeof load };
  export default yaml;
}
