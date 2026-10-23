# Обязательный базовый промпт обложек

У каждой публикации должна быть собственная обложка. Прочитать этот файл и [описание референсов](../guides/BLOG_COVERS.md) перед генерацией. Использовать навык imagegen и встроенный генератор; исходные картинки передавать как референсы стиля. Сохранять финальный файл в `content/blog/<slug>/`, подключать через обязательное поле `cover`, проверять уменьшенную карточку и обложку статьи. Не использовать скриншот внутри статьи вместо обложки.

## Постоянная часть промпта

```text
Create a new landscape editorial cover in a coherent cinematic cyberpunk illustration series. Aspect ratio approximately 1.9:1.
Use the two reference images ONLY for artistic execution, never for copying their composition or subject.
Reference 1: a rain-soaked futuristic alley at street level; layered industrial facades, pipes and cables; dark metallic android in the left foreground, cyan holographic display, an orange illuminated gateway in the distance, moving drones, wet reflections and volumetric mist. Extract its believable gunmetal, hard-surface detail, cinematic depth, contrast and atmospheric lighting.
Reference 2: a vast dark server environment seen from an elevated three-quarter angle; finely engineered transmitter core, translucent emerald paper-plane hologram, messages sweeping diagonally into the distance; intricate machinery, smoked glass, dark server architecture and selective lime accents. Extract its tactile material finish, emerald/charcoal palette, scale, lighting and clarity at thumbnail size.
Shared style: premium photorealistic 3D sci-fi concept art; finely machined dark metal, realistic glass and reflections, atmospheric depth, subtle particles, volumetric light and restrained bloom. Rich charcoal shadows, emerald and selective lime-green #7cff5a highlights, cool teal secondary light. Avoid uniform green wash.
For THIS cover create an entirely new story, camera angle, subject and composition appropriate to ARTICLE_TOPIC. Preserve visual quality, not previous objects. Never recolor or rearrange the old robot/alley/gateway or transmitter/flock composition.
Build a clear visual metaphor with a few readable focal forms and detailed supporting environment. Keep important objects within the central 70 percent for thumbnail cropping.
No captions, title overlay, numbers, customer records, watermark, screenshots, flat diagrams, app mockups, cartoon or stock-photo appearance. Opaque background.
```

## Переменная часть

После постоянной части добавить тему статьи, самостоятельный сюжет, новый ракурс и список нежелательных повторов из предыдущих обложек. Не использовать один и тот же центральный объект для каждой публикации. Надписи нужны только по отдельному запросу владельца.

Референсы: `content/blog/llms-txt-useless/llms-txt-useless.png`, `content/blog/telegram-ads-ib-vendor/telegram-ads-ib-vendor-cover.png`.
