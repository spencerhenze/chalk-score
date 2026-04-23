export const environment = {
  production: true,
  nativeBrowser: true,
  apiBaseUrl: 'https://api.chalkscore.app',
  auth0: {
    domain: 'YOUR_PROD_AUTH0_DOMAIN',
    clientId: 'YOUR_PROD_AUTH0_CLIENT_ID',
    audience: 'https://chalkscore-api',
    redirectUri: 'com.chalkscore.app://callback',
  },
};
