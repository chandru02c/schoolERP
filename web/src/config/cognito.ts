/**
 * File: src/config/cognito.ts
 * Description: Re-export of COGNITO_CONFIG from the centralized environment.ts configuration.
 *              Maintained for backward compatibility across existing services.
 */

export { COGNITO_CONFIG, APP_DOMAIN, API_BASE_URL, default } from './environment';
