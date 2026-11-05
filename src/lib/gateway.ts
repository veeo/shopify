/** True when AI Gateway requests can authenticate (an API key locally, or the deployment's OIDC token on Vercel). */
export function gatewayAvailable(request: Request) {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || request.headers.has("x-vercel-oidc-token"));
}
