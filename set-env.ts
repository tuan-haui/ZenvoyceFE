/// <reference types="node" />

const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const targetPath = resolve(process.cwd(), 'src/environments/environment.prod.ts');
const apiTokenUrl = process.env['NG_APP_API_URL'] ?? 'https://api.feephim.com';

const envConfigFile = `export const environment = {
  production: true,
  API_TOKEN_URL: '${apiTokenUrl}'
};
`;

writeFileSync(targetPath, envConfigFile, { encoding: 'utf8' });