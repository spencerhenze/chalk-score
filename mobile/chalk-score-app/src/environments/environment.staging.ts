export const environment = {
  production: false,
  nativeBrowser: true,
  apiBaseUrl: 'https://api.staging.chalkscore.app',
  auth0: {
    domain: 'YOUR_STAGING_AUTH0_DOMAIN',
    clientId: 'YOUR_STAGING_AUTH0_CLIENT_ID',
    audience: 'https://chalkscore-api-staging',
    redirectUri: 'com.chalkscore.app://callback',
  },
};
