/// <reference types="node" />

const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const environmentPath = resolve(process.cwd(), 'src/environments/environment.ts');
const environmentDevelopmentPath = resolve(process.cwd(), 'src/environments/environment.development.ts');
const environmentProdPath = resolve(process.cwd(), 'src/environments/environment.prod.ts');

const apiTokenUrl = process.env['NG_APP_API_URL'] ?? 'https://api.feephim.com';
const developmentApiTokenUrl = process.env['NG_APP_API_URL_DEV'] ?? 'https://localhost:8080';

const productionConfigFile = `export const environment = {
  production: true,
  API_TOKEN_URL: '${apiTokenUrl}'
};
`;

const developmentConfigFile = `export const environment = {
  production: false,
  API_TOKEN_URL: '${developmentApiTokenUrl}'
};
`;

writeFileSync(environmentPath, productionConfigFile, { encoding: 'utf8' });
writeFileSync(environmentDevelopmentPath, developmentConfigFile, { encoding: 'utf8' });
writeFileSync(environmentProdPath, productionConfigFile, { encoding: 'utf8' });