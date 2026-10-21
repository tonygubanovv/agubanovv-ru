/** @type {import('next').NextConfig} */
const nextConfig = {
  // Статический экспорт для GitHub Pages
  output: 'export',
  // Отключаем сжатие изображений (не нужен для статического сайта)
  images: {
    unoptimized: true,
  },
  // trailingSlash для корректных ссылок на GitHub Pages
  trailingSlash: true,
}

module.exports = nextConfig
