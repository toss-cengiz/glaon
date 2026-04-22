export type {
  BeforeSendFunction,
  ObservabilityBreadcrumb,
  ObservabilityConfig,
  ObservabilityEvent,
  ObservabilityRequest,
} from './types';

export {
  REDACTED,
  SENSITIVE_HEADER_NAMES,
  SENSITIVE_KEY_SUBSTRINGS,
  SENSITIVE_URL_PARAMS,
  buildBeforeSend,
  scrubEvent,
  scrubHeaders,
  scrubQueryString,
  scrubRecursive,
  scrubUrl,
} from './scrubber';
