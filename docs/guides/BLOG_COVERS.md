# Обложки блога

## Зелёная версия llms.txt

В статье и карточках используется `src/assets/blog/llms-txt-useless-green.png`. Исходный файл `llms-txt-useless.png` сохранён как референс. Встроенным image_gen изменена палитра существующей сцены: зелёные неон, подсветка и отражения вместо оранжевых.

Промпт редактирования:

```text
Edit image 1 ONLY by changing its color palette. Image 1 is the edit target, NOT a composition reference. Preserve exactly its original composition, framing, dimensions/aspect ratio approximately 1.9:1, all characters and their positions and poses, all robot and drone shapes, architecture, rainfall, wet asphalt, smoke, reflections, movement, detail and camera perspective. Preserve the exact typography and text: "ROBOTS.TXT" above the gateway and the existing small llms.txt display text. Do NOT create a new scene or change any objects.
Recolor the dominant orange neon sign, gateway trim, orange lighting, robot glows, sparks and corresponding wet pavement reflections into luminous emerald and lime-green tones matching #7cff5a highlights. Shift most cyan hologram and neon accents toward emerald/green as well, while keeping restrained cool teal shadows. Keep the environment and metallic robots dark charcoal/gunmetal with realistic material detail, natural neutral highlights and cinematic contrast. Match the green family of the site's other cyberpunk covers. The result must read as the SAME original image with a greener cinematic grade, not a uniform flat green tint. No added text or new objects. Opaque background.
```

## Обложка статьи Salesbot

Файл: `src/assets/blog/salesbot-utm-amocrm-cover.png`. Встроенный image_gen, два референса стиля. Новая композиция: крупная прозрачная UTM-метка в металлическом оптическом сканере, слева модуль сообщений, справа стеклянные карточки CRM. Световые линии показывают сохранение источника сообщения. Мокрый технический стол и размытые огни города на заднем плане. Иллюстрация темы, а не снимок реальной интеграции.

Точный промпт:

```text
Create a completely NEW landscape editorial cover for the article about transferring UTM attribution from a Telegram bot into Salesbot amoCRM. Aspect ratio about 1.9:1. Match the cinematic photorealistic cyberpunk 3D rendering of the two references, but use a genuinely different visual concept and composition.
The references are STYLE ONLY: layered realistic dark metal, intricate hard-surface detail, smoked glass, atmospheric depth, rich charcoal shadows, selective emerald/lime-green and restrained cyan lighting, premium science-fiction film still. Do not reproduce any reference objects.
New scene: an extreme cinematic close-up of a beautifully engineered source-tracking device on a rain-speckled futuristic rooftop workbench at night. The central hero is a single large translucent emerald tag-shaped data chip with a small circular hole, suspended upright inside a dark precision-metal optical scanning ring. The chip has intricate luminous microcircuits but NO writing. A thin glowing fiber-optic route enters the scanner from a compact chat-bubble-shaped communication module in the left foreground, then exits toward three orderly floating smoked-glass record cards docked in a metal cradle on the right. This communicates identifying the origin of an incoming message and preserving it in CRM records. The main readable shape is the green attribution tag, NOT a paper plane or robot.
Camera: close low-angle three-quarter macro shot, tag and scanning ring sharply focused near center, small communication module on left and record cradle on right supporting the story. In the distance, soft futuristic city bokeh and fine mist; not a server hall or a narrow alley. Restrained rain droplets on foreground metal, physically believable glass refractions and reflections, subtle volumetric light beams, shallow atmospheric perspective. Use a few strong forms with detailed engineering, visually clear in a small blog thumbnail.
Palette: blackened steel, graphite, emerald illumination and selective lime #7cff5a accents, neutral white highlights, subtle dark teal background. No uniform green wash.
MUST be different from the previous covers: NO humanoid or robot arm, NO paper plane, NO sphere transmitter, NO flying fleet, NO conveyor, NO rack of cartridges, NO portal or billboard. No letters, numbers, logos, typography, watermark, UI screenshot, flat illustration, cartoon or stock photo. Keep key forms inside central 70% for thumbnail cropping. Opaque background.
```

У каждой публикации обязательна обложка. Постоянная часть промпта: [BLOG_COVER_STYLE.md](../prompts/BLOG_COVER_STYLE.md).

## Описание исходной обложки

Референс: `src/assets/blog/llms-txt-useless.png`, 1200 × 630 px. Кинематографичная детальная 3D-иллюстрация в эстетике киберпанка. Камера на уровне улицы, широкий угол. Узкий ночной переулок под дождём уходит в глубину между промышленными фасадами с трубами, проводами и световыми панелями. На переднем плане слева — тёмный металлический андроид, показанный со спины в три четверти; он взаимодействует с полупрозрачным бирюзовым экраном. В правой части вдали — большой прямоугольный портал с оранжевой вывеской ROBOTS.TXT. Роботы и дроны в движении создают масштаб и глубину. Асфальт мокрый, с длинными отражениями неона. Холодный бирюзовый свет контрастирует с оранжевыми огнями и искрами. Дождь, объёмный свет, дымка и небольшое размытие движущихся объектов придают сцене атмосферу кадра из фантастического фильма. Детализация материалов высокая: сочленения брони, матовый металл, блестящие мокрые поверхности.

## Принцип единого стиля

Сохранять качество 3D-рендера, реалистичные металлические и стеклянные фактуры, кинематографичный свет, объёмную атмосферу и детализацию. Для каждой обложки выбирать самостоятельный сюжет, набор объектов, ракурс и композицию. Не повторять робота, переулок, портал и вывеску из первой обложки.

## Обложка кейса Telegram Ads

Файл: `src/assets/blog/telegram-ads-ib-vendor-cover.png`. Создан встроенным image_gen; исходная обложка служит только референсом визуального исполнения. Подробности референса: высокий ракурс в три четверти, передний план занят сложным металлическим ядром передатчика с кольцевыми деталями и прозрачным защитным полем. Над ним светится крупный зелёный бумажный самолётик; меньшие самолётики образуют диагональный поток вправо и в глубину. По краям и вдалеке — многоэтажные серверные массивы, технические мостики и световые индикаторы. Материалы контрастируют: глянцевый и матовый металл, дымчатое стекло, изумрудные голограммы. Объёмный свет и дымка разделяют планы; детали читаются в тёмной палитре.

Новый сюжет — технологический передатчик в дата-центре, над ним голограмма бумажного самолётика; поток сообщений уходит к серверным массивам. Диагональная композиция, ракурс сверху в три четверти. Палитра — угольный, изумрудный и лаймовый. Обложка иллюстративная; реальный статистический график внутри статьи хранится отдельно.

## Точный промпт

```text
Use case: stylized-concept.
Asset type: landscape editorial cover for a real Telegram Ads audience-growth case study, aspect ratio 1.9:1, premium cinematic sci-fi illustration.
Primary request: a COMPLETELY NEW SUBJECT AND COMPOSITION in the same cinematic photorealistic cyberpunk rendering style as the supplied image. Reference image 1 is ONLY a reference for material realism, high-end 3D detail, atmospheric depth, industrial design sophistication and cinematic lighting. DO NOT copy its scene or composition. Absolutely NO humanoid robots, NO street or alley, NO portal or gateway, NO neon sign, NO standing figure looking at a panel. No text anywhere.
New scene: inside a vast dark futuristic cybersecurity data center, a beautifully engineered black gunmetal communications core floats above a compact precision-machined hexagonal transmitter platform. The core has translucent smoked-glass layers and finely detailed mechanical fins, intricate brushed-metal surfaces, subtle cables and illuminated green seams. Above this transmitter, a single large sculptural translucent emerald paper-plane hologram is becoming solid light. It emits a graceful expanding stream of smaller luminous paper planes that sweep diagonally through the space toward distant server arrays, suggesting advertising messages reaching a growing relevant audience. The planes form an elegant visual rhythm, NOT a chart or flat infographic. A subtle curved translucent shield field around the platform suggests protected infrastructure. The transmitter is the hero object, not a person or character.
Composition: dramatic close three-quarter overhead camera view, hero platform occupying the lower central foreground, luminous messages sweeping into the upper right distance; strong diagonal composition rather than frontal symmetrical architecture. Deep server architecture recedes softly into shadow. Large sharp focal forms readable as a small thumbnail, foreground hardware detail, foreground-to-background scale falloff. Different spatial layout from the reference.
Style: cinematic photorealistic 3D hard-surface sci-fi concept art, physically believable materials, fine machining, realistic glass refraction, volumetric shafts in subtle mist, restrained lens bloom, rich shadows and tactile highlights. Match reference level of finish, not its depicted objects. Dark charcoal and gunmetal base, deep forest and emerald light with selective lime-green #7cff5a highlights; restrained cool teal in the shadows, no orange dominant accents. Do not wash everything in green.
Constraints: no readable writing, no lettering, no numbers or metrics, no Telegram Ads billboard, no humans or androids, no combat, no fire, no explosions, no watermarks, no flat vector illustration, no cartoon, no screenshot, no UI mockup. No copy of previous robot-and-portal cover. Key objects within central 80% for card cropping. Opaque background.
```
