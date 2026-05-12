import { createConfigurationError } from "./error-handler.js";

export type HeaderRecord = Record<string, string>;

const HEADER_NAME_REGEX = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const RESERVED_HEADER_NAMES = new Set(["__proto__", "constructor", "prototype"]);

function createHeaderRecord(): HeaderRecord {
  return Object.create(null) as HeaderRecord;
}

function normalizeHeaderName(envVarName: string, name: string): string {
  const normalizedName = name.trim().toLowerCase();

  if (normalizedName === "") {
    throw createConfigurationError(`${envVarName} contains an empty header name`);
  }

  if (!HEADER_NAME_REGEX.test(normalizedName)) {
    throw createConfigurationError(`${envVarName} contains invalid header name "${name}"`);
  }

  if (RESERVED_HEADER_NAMES.has(normalizedName)) {
    throw createConfigurationError(`${envVarName} contains reserved header name "${name}"`);
  }

  return normalizedName;
}

function setHeader(headers: HeaderRecord, envVarName: string, name: string, value: string): void {
  headers[normalizeHeaderName(envVarName, name)] = value;
}

function normalizeHeaders(headers?: HeadersInit): HeaderRecord {
  const normalizedHeaders = createHeaderRecord();

  if (!headers) {
    return normalizedHeaders;
  }

  if (headers instanceof Headers) {
    for (const [name, value] of headers.entries()) {
      setHeader(normalizedHeaders, "headers", name, value);
    }
    return normalizedHeaders;
  }

  if (Array.isArray(headers)) {
    for (const [name, value] of headers) {
      setHeader(normalizedHeaders, "headers", name, value);
    }
    return normalizedHeaders;
  }

  for (const [name, value] of Object.entries(headers)) {
    setHeader(normalizedHeaders, "headers", name, value);
  }

  return normalizedHeaders;
}

export function parseHeadersFromEnv(envVarName: string): HeaderRecord {
  const rawHeaders = process.env[envVarName];
  if (!rawHeaders) {
    return createHeaderRecord();
  }

  return parseHeadersJson(rawHeaders, envVarName);
}

export function parseHeadersFromBase64Env(envVarName: string): HeaderRecord {
  const rawHeaders = process.env[envVarName];
  if (!rawHeaders) {
    return createHeaderRecord();
  }

  let decodedHeaders: string;
  try {
    decodedHeaders = Buffer.from(rawHeaders, "base64").toString("utf8");
  } catch {
    throw createConfigurationError(`${envVarName} must be valid base64`);
  }

  return parseHeadersJson(decodedHeaders, envVarName);
}

function parseHeadersJson(rawHeaders: string, envVarName: string): HeaderRecord {
  let parsedHeaders: unknown;
  try {
    parsedHeaders = JSON.parse(rawHeaders);
  } catch {
    throw createConfigurationError(`${envVarName} must be valid JSON`);
  }

  if (
    typeof parsedHeaders !== "object" ||
    parsedHeaders === null ||
    Array.isArray(parsedHeaders)
  ) {
    throw createConfigurationError(`${envVarName} must be a JSON object`);
  }

  const headers = createHeaderRecord();
  for (const [name, value] of Object.entries(parsedHeaders)) {
    if (typeof value !== "string") {
      throw createConfigurationError(`${envVarName}.${name} must be a string`);
    }

    setHeader(headers, envVarName, name, value);
  }

  return headers;
}

export function getSearxngHeadersFromEnv(): HeaderRecord {
  return getHeadersFromEnv("SEARXNG_HEADERS", "SEARXNG_HEADERS_BASE64");
}

export function getUrlReaderHeadersFromEnv(): HeaderRecord {
  return getHeadersFromEnv("URL_READER_HEADERS", "URL_READER_HEADERS_BASE64");
}

function getHeadersFromEnv(jsonEnvVarName: string, base64EnvVarName: string): HeaderRecord {
  return mergeHeaders(parseHeadersFromEnv(jsonEnvVarName), parseHeadersFromBase64Env(base64EnvVarName));
}

export function mergeHeaders(headers: HeadersInit | undefined, additionalHeaders: HeaderRecord): HeaderRecord {
  const mergedHeaders = normalizeHeaders(headers);

  for (const [name, value] of Object.entries(additionalHeaders)) {
    setHeader(mergedHeaders, "headers", name, value);
  }

  return mergedHeaders;
}
