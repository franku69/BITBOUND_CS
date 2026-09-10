/** Native filesystem paths for the pinned Pyodide Node entrypoint. */
import {fileURLToPath} from 'node:url';

export function runtimePath(url, options) {
  // URL.pathname is not a filesystem path: on Windows it retains /D:/ and
  // leaves spaces/non-ASCII characters percent-encoded.
  return fileURLToPath(url, options);
}
