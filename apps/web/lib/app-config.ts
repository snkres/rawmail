// Server-side only — never import in 'use client' components
export function getWebConfig() {
  return {
    isSaas: (process.env.IS_SAAS ?? 'true') !== 'false',
    appName: process.env.APP_NAME ?? 'rawmail',
    appDomain: process.env.APP_DOMAIN ?? 'rawmail.sh',
  }
}
