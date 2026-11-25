import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readScriptUrl = (source: unknown): string | undefined => {
  if (!isRecord(source)) return undefined;
  if (typeof source.scriptURL === 'string') return source.scriptURL;
  if (typeof source.getConstants === 'function') {
    const constants: unknown = source.getConstants();
    if (isRecord(constants) && typeof constants.scriptURL === 'string')
      return constants.scriptURL;
  }
  return undefined;
};

const configuredApiUrl = (): string | undefined => {
  const module: unknown = NativeModules.RNCConfigModule;
  if (!isRecord(module) || typeof module.getConfig !== 'function') return undefined;
  const result: unknown = module.getConfig();
  if (!isRecord(result) || !isRecord(result.config)) return undefined;
  const apiUrl = result.config.API_URL;
  return typeof apiUrl === 'string' ? apiUrl : undefined;
};

const metroScriptUrl = (): string | undefined => {
  const turboSourceCode: unknown = TurboModuleRegistry.get('SourceCode');
  return readScriptUrl(turboSourceCode) ?? readScriptUrl(NativeModules.SourceCode);
};

const normalizeUrl = (url: string): string => url.trim().replace(/\/+$/, '');

export const resolveApiUrl = (
  configuredUrl: string | undefined = configuredApiUrl(),
  development: boolean = __DEV__,
  scriptUrl: string | undefined = metroScriptUrl(),
  platform: string = Platform.OS,
): string => {
  const configured = configuredUrl ? normalizeUrl(configuredUrl) : '';
  if (configured) {
    if (!/^https?:\/\//i.test(configured))
      throw new Error('The Royal Club server URL must start with http:// or https://.');
    if (!development && !/^https:\/\//i.test(configured))
      throw new Error('The Royal Club production server URL must use HTTPS.');
    return configured;
  }

  if (!development)
    throw new Error('Royal Club server URL is not configured for this app build.');

  const metroHost = scriptUrl?.match(/^https?:\/\/([^/:?#]+)/i)?.[1];
  const host = metroHost || (platform === 'android' ? '10.0.2.2' : 'localhost');
  return `http://${host}:4000/api`;
};
