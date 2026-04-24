import type { FastifyPluginAsync } from 'fastify'
import { getConfig } from '@rawmail/config'

export const configRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async () => {
    const cfg = getConfig()
    return {
      isSaas: cfg.isSaas,
      appName: cfg.appName,
      appDomain: cfg.appDomain,
      mxTarget: cfg.mxTarget,
      authProvider: cfg.isOidcConfigured()
        ? 'oidc'
        : cfg.allowedEmailDomain
        ? 'google-hd'
        : 'google',
      allowedEmailDomain: cfg.allowedEmailDomain,
    }
  })
}
