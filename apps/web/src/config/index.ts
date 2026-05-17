// LocalStorageBackend + useDeviceConfig are exported from their source
// modules but kept out of this barrel until a consumer needs them; knip
// blocks unused barrel exports. SetupGate (#539) will re-export
// useDeviceConfig from here once it imports it.
export { WebConfigStore } from './web-config-store';
export { ConfigProvider } from './config-provider';
