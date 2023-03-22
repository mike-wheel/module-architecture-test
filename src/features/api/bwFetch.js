export function bwFetch(url, options) {
  return fetch(url, {
    ...options,
    // other bw stuff
  });
}
