// Типы Astro подключает `.astro/types.d.ts` (см. include в tsconfig.json):
// двойная ссылка на astro/client ставит в программу заглушки astro:content
// раньше сгенерированных типов, и данные коллекции теряют тип.

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_REPO?: string;
  readonly PUBLIC_CONTENT_DIR?: string;
  readonly PUBLIC_COVER_DIR?: string;
  readonly PUBLIC_MAIN_BRANCH?: string;
  readonly PUBLIC_CONTACT_EMAIL?: string;
  readonly PUBLIC_CONTACT_TELEGRAM?: string;
  readonly PUBLIC_CONTACT_GITHUB?: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
