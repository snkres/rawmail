export function getConfig() {
  const isSaas = (process.env.IS_SAAS ?? 'true') !== 'false'
  const appDomain = process.env.APP_DOMAIN ?? process.env.RAWMAIL_DOMAIN ?? 'rawmail.sh'
  const mxTarget = process.env.MX_TARGET ?? `mx.${appDomain}`
  const appName = process.env.APP_NAME ?? 'rawmail'
  const allowedEmailDomain = process.env.ALLOWED_EMAIL_DOMAIN || null

  return {
    isSaas,
    appDomain,
    mxTarget,
    appName,
    allowedEmailDomain,
    oidc: {
      clientId: process.env.OIDC_CLIENT_ID || null,
      clientSecret: process.env.OIDC_CLIENT_SECRET || null,
      issuerUrl: process.env.OIDC_ISSUER_URL || null,
    },
    polar: {
      accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? '',
      server: (process.env.POLAR_SERVER ?? 'sandbox') as 'sandbox' | 'production',
      teamsProductId: process.env.POLAR_TEAMS_PRODUCT_ID ?? '',
    },
    isOidcConfigured() {
      return !!(this.oidc.clientId && this.oidc.clientSecret && this.oidc.issuerUrl)
    },
  }
}

export type AppConfig = ReturnType<typeof getConfig>
