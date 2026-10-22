# Домен agubanovv.ru

Владелец разрешил перенос на `https://agubanovv.ru/`, основной адрес без `www`. Домен зарегистрирован в Рег.ру. 23.10.2026 владелец переключил DNS на Cloudflare: `gracie.ns.cloudflare.com`, `jack.ns.cloudflare.com`. Четыре A-записи и `www` работают в режиме «Только DNS», сайт по-прежнему размещён на GitHub Pages. Ниже сохранена исходная конфигурация Рег.ру для истории и возможного возврата.

## Код сайта

- Astro: `site: 'https://agubanovv.ru'`, `base: '/'`, `trailingSlash: 'always'`.
- `public/CNAME`: только `agubanovv.ru`.
- Все ссылки, canonical, OG, JSON-LD, robots и sitemap используют новый origin. Контакты и ID аналитики сохраняются в site config.
- Smoke проверяет корневые ссылки, реальные файлы, CNAME, метаданные и счётчики.

## Исходная DNS-зона в Рег.ру и возврат

До перехода на Cloudflare использовались `ns1.reg.ru`, `ns2.reg.ru`. Для возврата сначала проверить, что на них сохранены приведённые ниже записи, затем восстановить эту пару NS у регистратора. Старый адрес хостинга `176.57.66.198` не возвращать. Смена NS распространяется не мгновенно; возврат может вернуть и прежнюю проблему проверки GitHub.

| Тип | Имя | Значение |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | tonygubanovv.github.io |
| CAA | @ | 0 issue "letsencrypt.org" |

У `www` после замены не должно оставаться A-записи. Wildcard `*` не нужен.

## GitHub Pages

В Settings → Pages: Source — GitHub Actions, Custom domain — `agubanovv.ru`. После успешного DNS check и выпуска сертификата — Enforce HTTPS. Если GitHub предлагает TXT для подтверждения владения, добавить ровно выданные GitHub имя и значение; не придумывать их. Проверка домена владельца — в настройках аккаунта Pages.

## Завершение переноса

Проверить публичные DNS (включая authoritative ns1.reg.ru), HTTPS главной, статьи и ассетов, перенаправление www, а также старого GitHub Pages URL. Распространение DNS и выпуск сертификата происходят отдельно от deploy; успешный workflow не доказывает готовность домена. Не обходить предупреждения о сертификате. Статус сообщать только после фактической проверки; не обещать 301 до проверки ответа сервера.

Официальная инструкция: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

## Проверка записей 22.10.2026 — расхождений с инструкцией нет

Сверка с официальным списком GitHub Pages: A-записи `@` должны быть `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, `www` — CNAME на `tonygubanovv.github.io`. Фактически резолвер отдаёт ровно эти четыре адреса, тот же набор, что и у самого `github.io`; лишних и недостающих записей нет. У `www` только CNAME, A-записей нет. Wildcard отсутствует: произвольное имя в зоне возвращает NXDOMAIN. MX, TXT и CAA в зоне нет, AAAA нет, DS в родителе `.ru` нет — DNSSEC не включён и мешать не может. Зона отдаётся согласованно: serial `1792625858` на всех серверах `ns1/ns2.reg.ru`. Google (`dns.google`) и Cloudflare (`cloudflare-dns.com`) — оба валидирующих резолвера — отвечают `Status=0` и корректные адреса по apex и корректный CNAME по `www`.

Причина висит на стороне GitHub. Его собственный health-check по домену отвечает `dns_resolves: false` с `InvalidDNSError` и `caa_error: "Dnsruby::ServFail"`, то есть чекер не получает вообще ни одной записи — не «записи неправильные», а «записи не прочитаны». Все поля про характер записей при этом `null`. Статус сертификата — `https_certificate.state: "new"` с текстом «certificate request process will begin shortly», хотя с момента добавления домена прошло около 21 часа, а документ GitHub обещает выпуск HTTPS «up to an hour».

Прямых DNS-запросов с машины владельца сейчас не сделать: UDP/53 и TCP/53 наружу обрезаются, системный резолвер Windows и HTTPS работают. Проверку зоны поэтому вести через `Resolve-DnsName` и DoH-эндпоинты Google/Cloudflare.

## Что происходит с сайтом без сертификата и что делать после выпуска

Пока `https_enforced: false`, поведение кривое, но объяснимое: `http://agubanovv.ru/` отвечает 200 без редиректа, `https://agubanovv.ru/` отдаёт запасной сертификат `CN=*.github.io` (в SAN нет ни apex, ни `www`) — браузер показывает `ERR_TLS_CERT_ALTNAME_INVALID`, `http://www.agubanovv.ru/` редиректит 301 на `http://agubanovv.ru/`, то есть на http, а не на https. Отсюда «на мобилке открывается без замка». Загрузить свой сертификат в Pages нельзя, поэтому сертификат GlobalSign со старого хостинга для этого сайта бесполезен.

Выпуск сертификата — единственное, чего не хватает. Порядок после того, как GitHub его выпустит: включить Enforce HTTPS → проверить 301 с `http://` → заново отправить sitemap в Search Console и Яндекс.Вебмастере. До этого момента рабочая версия — `http://agubanovv.ru/`: редиректа нет, в вёрстке нет ни одного ресурса по `https://`, кроме внешней ссылки на Telegram, смешанного содержимого на http нет. Предупреждение о сертификате «прокликать» как норму нельзя.

## Повторная диагностика и попытка восстановления — 22.10.2026, 23:11 МСК

- GitHub API подтверждает: `cname: agubanovv.ru`, `build_type: workflow`, `https_enforced: false`, сертификат в состоянии `new`. Последний deploy `39846031946` завершился успешно.
- Google и Cloudflare независимо возвращают четыре правильных A-записи и правильный CNAME для `www`. Лишних AAAA у корня нет. CAA у корня отсутствует — это не запрет выпуска. Запрос CAA для `www` через Cloudflare следует по CNAME и возвращает разрешение `letsencrypt.org`. DS отсутствует.
- Главная, `/blog/` и `/blog/telegram-ads-ib-vendor/` отвечают HTTP 200. `www` и прежний адрес GitHub Pages ведут на HTTP основного домена. HTTPS у корня и `www` не проходит проверку имени сертификата.
- По запросу владельца через Pages API выполнено удаление привязки и немедленное повторное сохранение **того же** `agubanovv.ru`. Оба запроса приняты (HTTP 204), домен восстановлен, режим GitHub Actions сохранён. Это перезапускает получение сертификата по официальной инструкции GitHub; это ещё не доказательство выпуска.
- После перезапуска GitHub health-check по обоим именам по-прежнему возвращает `dns_resolves: false`, `InvalidDNSError`, `caa_error: Dnsruby::ServFail`. Успешное исправление HTTPS пока не подтверждено.
- При заключительном запросе health endpoint перешёл на HTTP 202 с пустым объектом: новая проверка ещё выполняется, это не успешный результат DNS. Сертификат при этом остаётся `new`. Проверенные CSS, JavaScript, шрифты и портрет отвечают HTTP 200, несуществующая страница — 404.
- Уточнение прежнего вывода: ошибка наблюдается в DNS-проверке GitHub. Публичные ответы DNS корректны, но этого недостаточно, чтобы однозначно различить проблему резолвера GitHub и недоступность DNS-серверов Рег.ру из его сети. Сообщение `ServFail` не означает, что нужно наугад добавлять CAA или менять A-записи.
- Код приложения не менялся. Локально прошли `npm run check` (21 тест, без ошибок; одна подсказка об устаревшем запасном методе копирования), `npm run build` и `npm run smoke`. Новых коммитов и push не было.

Дальше: дать перезапущенному процессу до часа согласно [инструкции GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages#https-errors), затем проверить Pages API/health и реальный HTTPS. Не перепривязывать домен многократно: это снова перезапускает процесс. После выпуска включить Enforce HTTPS и проверить оба имени и перенаправления. Если `ServFail` сохранится, обратиться в поддержку GitHub и Рег.ру с данными ниже. Доступный по HTTP сайт не означает завершённый перенос.

### Готовый текст обращения в GitHub Support (не отправлен)

Repository: https://github.com/tonygubanovv/agubanovv-ru

Custom domain: agubanovv.ru, alternate: www.agubanovv.ru. GitHub Pages uses a custom Actions workflow; the latest deployment succeeded. The Pages health endpoint reports `dns_resolves: false`, `InvalidDNSError` and `caa_error: Dnsruby::ServFail` for both names. The certificate remains in state `new`; HTTPS presents a certificate that does not match either hostname.

Google Public DNS, Cloudflare, Quad9 and OpenDNS resolve the apex to 185.199.108.153, 185.199.109.153, 185.199.110.153 and 185.199.111.153. Google and Cloudflare also confirm www CNAME tonygubanovv.github.io. The nameservers are ns1.reg.ru and ns2.reg.ru. An explicit apex CAA `0 issue "letsencrypt.org"` was added and confirmed publicly on 2026-10-22 at 20:21 UTC; the updated SOA serial is 1792700256. No apex AAAA or parent DS was found. CAA resolution through the www CNAME also permits letsencrypt.org. All 16 authoritative IPv4 addresses answered direct UDP and TCP CAA queries during testing; uncached random-name queries via Google and Cloudflare returned the expected NXDOMAIN.

On 2026-10-22 at approximately 20:10 UTC, the custom domain was removed and immediately re-added using the Pages API as recommended in your documentation. After the CAA update propagated, one further reset was performed at approximately 20:27 UTC. The binding was immediately restored each time; all updates returned HTTP 204. Subsequent health checks still return SERVFAIL. Workflow run 39846031946 was also rerun against the same current main SHA 6b347507c948d9298afd5373d269fda0bfd85228 and completed successfully (attempt 2), without fixing the health check. Please investigate DNS resolution from the Pages checker and the stalled certificate provisioning job. We would like to retain the current DNS provider.

### Готовый текст обращения в Рег.ру (не отправлен)

Для домена agubanovv.ru используются ns1.reg.ru и ns2.reg.ru, SOA serial 1792625858. Google и Cloudflare видят правильные A-записи GitHub Pages и CNAME www на tonygubanovv.github.io. Однако DNS-проверка GitHub Pages для обоих имён возвращает InvalidDNSError и Dnsruby::ServFail, из-за чего сертификат не выпускается. Просьба проверить доступность всех адресов обоих authoritative DNS-серверов из зарубежных сетей по UDP/TCP 53, ответы на A/CNAME/CAA и отрицательные ответы CAA, а также возможные сетевые фильтры или ограничения запросов. Просьба не менять зону без согласования.

## Продолжение исправления — 22.10.2026, 23:21 МСК

Владелец попросил решить задачу самостоятельно без общения с поддержкой и продолжать в текущем чате. Приведённые выше обращения не отправлялись.

- Через уже авторизованный Яндекс Браузер проверена реальная зона Рег.ру: ровно четыре правильных A-записи и CNAME `www`, других ресурсных записей до исправления нет.
- Google и Cloudflare проверены также запросами к уникальному случайному поддомену: оба возвращают NXDOMAIN с SOA. Это исключает объяснение, при котором правильные ответы видны только из старого кэша.
- Вне ограниченной среды прямые запросы UDP и TCP на порт 53 работают: все 16 опубликованных IPv4-адресов ns1/ns2.reg.ru ответили на CAA авторитетным NOERROR. Прежнее замечание о недоступности прямых DNS-запросов не описывает эту проверку.
- Для проверки обходного решения проблемы с пустыми CAA-ответами добавлена одна запись: `CAA @ 0 issue "letsencrypt.org"`. Она явно разрешает используемый GitHub центр сертификации и ограничивает выпуск другими центрами. A, CNAME и DNS-серверы не менялись. Отсутствие CAA само по себе не было ошибкой; эта попытка не доказывает причину сбоя. Основание: [описание ошибок CAA у Let's Encrypt](https://letsencrypt.org/docs/caa/).
- Рег.ру подтвердил сохранение. В 23:21 МСК Google Public DNS уже вернул новую CAA и SOA serial `1792700256`, то есть запись опубликована.
- Сертификат на этот момент всё ещё `new`. Обязательный HTTPS не включён. Попытка преждевременного включения была отклонена автоматической проверкой безопасности до выполнения команды; дальше выполняются только чтение и проверка готовности сертификата.
- В текущем чате запущено ограниченное ожидание сертификата с проверками через 45 секунд. После `approved` требуется сначала проверить оба реальных HTTPS-имени с обычной валидацией TLS и только затем включить Enforce HTTPS. Никаких обходов TLS-проверки.

## Решение владельца — DNS остаётся в Рег.ру, 22.10.2026

Владелец отклонил предложенный перенос DNS на Cloudflare: «Оставить DNS в Рег.ру». Перенос не начинался; ns1.reg.ru и ns2.reg.ru сохраняются. Обращения в поддержку не отправлять без отдельного разрешения.

После публикации CAA выполнен один дополнительный перезапуск привязки того же домена, примерно в 23:27 МСК. GitHub принял оба запроса с HTTP 204. Это отдельная попытка после фактического изменения DNS; не повторять сброс привязки при каждой проверке.

В 23:40 МСК сертификат всё ещё `new`, Enforce HTTPS выключен, реальный HTTPS не проходит проверку имени сертификата. Health endpoint ответил HTTP 202 — проверка в процессе, это не подтверждение успеха. Проблема не устранена. Изменять код приложения ради этой ошибки оснований нет.

Дополнительное ожидание до 23:44 МСК не показало продвижения: все пять проверок через 45 секунд вернули сертификат `new`. Процесс ожидания завершён; фоновых проверок не осталось. DNS не переносился, новых изменений зоны и сбросов домена в этой серии не было.

## Дополнительные попытки — 22.10.2026, после 23:47 МСК

- По повторному запросу владельца перезапущен последний успешный workflow `39846031946` для того же SHA `6b347507c948d9298afd5373d269fda0bfd85228`, совпадающего с текущим main. Попытка №2 завершилась успешно; новых коммитов, push и изменений исходников не было. Сертификат после неё по-прежнему `new`.
- В пользовательском браузере проверены подключённые услуги Рег.ру. Есть Hosting Хост-0, срок предоставления истекает 23.10.2026. Делать DNS зависимым от этой истекающей услуги без решения о её дальнейшем использовании нельзя. Продление, заказ новых услуг и смена DNS не выполнялись.
- Найдены независимые сообщения владельцев сайтов с тем же сочетанием `InvalidDNSError`, `Dnsruby::ServFail`/`ResolvTimeout` и ns1/ns2.reg.ru: [209534](https://github.com/orgs/community/discussions/209534), [209751](https://github.com/orgs/community/discussions/209751), [210304](https://github.com/orgs/community/discussions/210304). В 209534 сам автор подтвердил, что перенос DNS решил проблему. Это свидетельство рабочего обхода в отдельном случае, а не доказательство точной причины нашего сбоя. Неподтверждённые объяснения комментаторов об EDNS, IPv6 и блокировках не считать установленными фактами.

## Переход на Cloudflare — 23.10.2026

Владелец изменил прежнее решение, подготовил домен в Cloudflare и сам переключил NS у регистратора. Агент перевёл четыре A-записи и CNAME `www` из проксирования в «Только DNS» и проверил ответы назначенных серверов до переключения. В 02:36 МСК Google и Cloudflare подтвердили новую пару NS, четыре правильных A-записи и CNAME. CAA разрешает Let's Encrypt; дополнительные CAA Cloudflare не блокируют его. DS у родителя отсутствует.

После согласованного повторного подтверждения NS обоими публичными резолверами выполнен один перезапуск привязки `agubanovv.ru` для запуска выпуска сертификата уже после смены DNS. Удаление и немедленное восстановление привязки приняты GitHub (HTTP 204). Первые ответы всё ещё показывают сертификат `new` и `Dnsruby::ServFail`; HTTPS пока не подтверждён. Не повторять сброс при каждом опросе. Правильные ответы двух резолверов не доказывают обновление кэша резолвера GitHub.

Перевыпуск DomainSSL в Рег.ру не выполнялся: установить сторонний сертификат на GitHub Pages нельзя, сертификатом Pages управляет GitHub. Не создавать ради этой ошибки CSR или приватный ключ. Исторические решения «оставить DNS в Рег.ру» выше описывают прежнее состояние, а не текущую конфигурацию.
