/** @type {import('next').NextConfig} */
const nextConfig = {
  // Статический экспорт для GitHub Pages
  output: 'export',
  // Для GitHub Pages project site (не user site): сайт живет под /<repo>/
  basePath: '/agubanovv-ru',
  assetPrefix: '/agubanovv-ru',
  // Отключаем сжатие изображений (не нужен для статического сайта)
  images: {
    unoptimized: true,
  },
  // trailingSlash для корректных ссылок на GitHub Pages
  trailingSlash: true,
}

module.exports = nextConfig
