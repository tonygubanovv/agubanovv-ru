# Обложки блога

## Обложка статьи Salesbot

Файл: `src/assets/blog/salesbot-utm-amocrm-cover.png`. Встроенный image_gen, два референса стиля. Самостоятельная сцена: механический манипулятор переносит светящиеся блоки из канала сообщений в упорядоченное хранилище CRM. Иллюстрация темы, а не снимок реальной интеграции.

Точный промпт:

```text
Use case: stylized-concept. Asset: a NEW landscape blog cover, approximately 1.9:1, matching a coherent premium cinematic cyberpunk 3D illustration series.
Style references: Image 1 (robot/alley/ROBOTS.TXT) and Image 2 (green transmitter/paper planes). Use them ONLY for rendering style: photorealistic high-detail hard-surface sci-fi, textured gunmetal, believable glass, atmospheric depth, cinematic lighting, refined green/cyan highlights against charcoal shadows. DO NOT copy the subject, objects, composition or camera from either image. Every cover must depict a new concept.
Article topic: passing UTM campaign attribution data from a Telegram bot into amoCRM Salesbot. Visual metaphor: a futuristic precision data-sorting workstation inside a dark industrial communications laboratory. A compact paper-plane-shaped metal transmitter at one side feeds several small luminous green transparent data cartridges along a visible glass conduit. In the center a finely engineered mechanical manipulator transfers one glowing cartridge into an organized rack of smoked-glass rectangular record slots on the other side. One subtle emerald light path connects sender, transfer mechanism and record rack, making the idea of retaining source information legible without text. The rack suggests CRM records, not a screenshot. Strong tactile surfaces, finely machined parts, connectors and cables, small suspended particles and atmospheric light shafts. Focus on the integration bridge and the transfer of a cartridge, not on a giant Telegram logo.
Composition: cinematic close side view at workstation level, asymmetric horizontally flowing arrangement with a few large readable forms, foreground hardware sharp, deep background softly atmospheric. The central transfer operation must stay within the central 70 percent to survive 16:10 thumbnail crop.
Palette: charcoal black, dark gunmetal, emerald and selective lime-green #7cff5a edges, cool teal background shadows, subtle neutral white practical lights. Preserve contrast and material detail; avoid uniform green wash. Film-quality realistic 3D render; not flat infographic or app UI.
Constraints: independent new scene; NO humanoid robot, NO alley, NO portal, NO billboard, NO central spherical transmitter, NO overhead view, NO flying flock of paper planes from the second reference. No text, no numbers, no captions, no watermarks, no real customer records, no combat or explosions. Opaque background.
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
