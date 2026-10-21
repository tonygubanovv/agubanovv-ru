# Домен agubanovv.ru

Владелец разрешил перенос на `https://agubanovv.ru/`, основной адрес без `www`. DNS в Рег.ру он настраивает самостоятельно. Сначала опубликованы новый дизайн и счётчики, затем подготовлена сборка для домена.

## Код сайта

- Astro: `site: 'https://agubanovv.ru'`, `base: '/'`, `trailingSlash: 'always'`.
- `public/CNAME`: только `agubanovv.ru`.
- Все ссылки, canonical, OG, JSON-LD, robots и sitemap используют новый origin. Контакты и ID аналитики сохраняются в site config.
- Smoke проверяет корневые ссылки, реальные файлы, CNAME, метаданные и счётчики.

## DNS в Рег.ру

DNS-серверы `ns1.reg.ru`, `ns2.reg.ru` остаются. Старые A-записи `@` и `www` на `176.57.66.198` нужно заменить, не очищая всю зону и не трогая другие записи.

| Тип | Имя | Значение |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | tonygubanovv.github.io |

У `www` после замены не должно оставаться A-записи. Wildcard `*` не нужен.

## GitHub Pages

В Settings → Pages: Source — GitHub Actions, Custom domain — `agubanovv.ru`. После успешного DNS check и выпуска сертификата — Enforce HTTPS. Если GitHub предлагает TXT для подтверждения владения, добавить ровно выданные GitHub имя и значение; не придумывать их. Проверка домена владельца — в настройках аккаунта Pages.

## Завершение переноса

Проверить публичные DNS (включая authoritative ns1.reg.ru), HTTPS главной, статьи и ассетов, перенаправление www, а также старого GitHub Pages URL. Распространение DNS и выпуск сертификата происходят отдельно от deploy; успешный workflow не доказывает готовность домена. Не обходить предупреждения о сертификате. Статус сообщать только после фактической проверки; не обещать 301 до проверки ответа сервера.

Официальная инструкция: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
