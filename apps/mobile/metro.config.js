// Приложение живёт в npm-workspace, поэтому Metro нужно показать оба
// каталога node_modules — свой и корневой, иначе он ищет вход в корне репозитория.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Без этого Metro поднимается вверх по дереву и путает версии пакетов.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
