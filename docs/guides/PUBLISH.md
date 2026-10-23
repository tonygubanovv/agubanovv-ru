# Публикация первой версии и обновлений

Репозиторий: [tonygubanovv/agubanovv-ru](https://github.com/tonygubanovv/agubanovv-ru).
Сайт: [agubanovv.ru](https://agubanovv.ru/).

## Порядок для любого агента

1. Получить прямую команду владельца на публикацию. Она разрешает обычные commit и push в main; повторное подтверждение не требуется.
2. Проверить текущую ветку, remote, свежесть main и состав файлов. Не перезаписывать чужие изменения и историю.
3. Выполнить `npm ci`, `npm run check`, `npm run build`, `npm run smoke`. Проверить локальный сайт и обе темы. Убедиться, что нет тестовых материалов, секретов и черновиков.
4. Просмотреть список файлов перед `git add`, затем staged diff. Включить исходники, package-lock и документацию; не добавлять dist, node_modules, .env, ключи и приватные файлы.
5. Создать commit и выполнить `git push origin main`. Не применять force push.
6. В [Actions](https://github.com/tonygubanovv/agubanovv-ru/actions) дождаться успеха сборки и deploy именно этого коммита. При ошибке изучить логи и исправить причину.
7. Открыть опубликованные главную, блог, проекты и 404; проверить прямые вложенные URL, темы и ассеты. Сообщить владельцу URL и реальный результат.

## Workflow

`.github/workflows/deploy.yml` запускается после push в main или вручную. Последовательно выполняет чистую установку, проверку типов, сборку и smoke. После успеха загружает только `dist/`; отдельная задача deploy публикует его с правами `pages:write` и `id-token:write`. Deploy дополнительно ограничен веткой main.

## Однократная настройка GitHub

В Settings → Pages → Build and deployment выберите Source: GitHub Actions. Если уже выбран этот режим, ничего менять не нужно. Custom domain: `agubanovv.ru`. `public/CNAME` содержит этот же домен. После успешной проверки DNS и выпуска сертификата проверить Enforce HTTPS. DNS на Рег.ру владелец меняет самостоятельно.

Если GitHub Settings недоступны агенту, он сообщает конкретное необходимое действие. Успешный push сам по себе не подтверждает публикацию.

Не отключайте Secret scanning и Push protection. Остальные настройки описаны в [правилах безопасности](../agents/specs/SECURITY.md).

Официальный порядок: [GitHub Pages с собственным workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
