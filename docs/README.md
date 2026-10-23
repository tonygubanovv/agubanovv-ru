# Документация проекта

Все руководства и запросы собраны здесь. В корне остаются `README.md` (обзор и запуск) и `AGENTS.md` (короткая ссылка на общие правила).

## Владельцу

- [Где что менять: карта проекта](guides/PROJECT_MAP.md).
- [Визуально редактировать статьи и SEO: MarkText](guides/VISUAL_EDITING.md).
- [Общая таблица метаданных](../content/seo.md).
- [Как поручать изменения](guides/START_HERE.md).
- [Как публикуется сайт](guides/PUBLISH.md).
- [Домен и DNS](guides/DOMAIN_LATER.md).
- [Приватность и аналитика](guides/PRIVACY.md).
- [Поиск: Яндекс, Google и Bing](guides/SEARCH_ENGINES.md).
- [Обложки блога: стиль и промпты](guides/BLOG_COVERS.md).
- [Блоки в статье: цитаты, заметки, подписи](guides/BLOG_BLOCKS.md).
- [Отложенные изменения](guides/TODO.md).

[Все инструкции для агентов](agents/README.md) находятся в одной папке `docs/agents/`.

## Утверждённые требования

- [Техническое задание](agents/specs/TECHNICAL_SPEC.md).
- [Дизайн-система](agents/specs/DESIGN_SYSTEM.md).
- [Контент и SEO](agents/specs/CONTENT_AND_SEO.md).
- [Безопасность](agents/specs/SECURITY.md).
- [Приёмка](agents/specs/ACCEPTANCE.md).

## Готовые запросы для любого агента

- [Добавить статью](agents/prompts/NEW_ARTICLE.md).
- [Обязательный промпт обложек](agents/prompts/BLOG_COVER_STYLE.md).
- [Проверить и опубликовать](agents/prompts/PUBLISH.md).
- [Первоначальное создание — архив, повторно не запускать](agents/prompts/INITIAL_BUILD.md).

## Устройство репозитория

```text
content/              редактируемые материалы
  seo.md              все метаданные одной таблицей
  blog/<slug>/        статья index.md и её изображения рядом
  images/             общие фотографии
src/                  код, собирающий сайт
  components/         общие элементы интерфейса
  layouts/            оболочка и шаблон публикации
  pages/              страницы и маршруты
  config/site.ts      сведения о владельце и настройки
  styles/             общие стили и темы
  utils/              ссылки, даты, коллекции, robots, sitemap и крошки
public/               общие изображения и favicon
docs/                 вся документация
  agents/             все инструкции, требования и промпты агентов
  guides/             руководства владельцу
scripts/              проверки сборки
.github/workflows/    проверка и публикация GitHub Pages
.qoder/rules/         правила подключения Qoder
```

`node_modules/`, `.astro/` и `dist/` создаются автоматически и игнорируются Git. Документация не попадает в сайт: Pages получает только `dist/`.
