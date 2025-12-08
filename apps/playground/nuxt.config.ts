// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-09-11",
  modules: ["@nuxt/eslint", "@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  devtools: { enabled: false },
  ssr: false,
  app: {
    baseURL: "/blockchain-commons/",
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/blockchain-commons/favicon.ico" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/blockchain-commons/favicon-16x16.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/blockchain-commons/favicon-32x32.png",
        },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/blockchain-commons/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "192x192",
          href: "/blockchain-commons/android-chrome-192x192.png",
        },
      ],
      meta: [{ name: "theme-color", content: "#1e40af" }],
    },
  },
});
