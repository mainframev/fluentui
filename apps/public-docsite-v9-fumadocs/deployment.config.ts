// The host prefix is separate from the /docs route shared by both collections.
export const hostingBase = process.env.DOCSITE_BASE_PATH || '/';

if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(hostingBase)) {
  throw new Error('DOCSITE_BASE_PATH must be a pathname with leading and trailing slashes, such as /fluentui/.');
}

export const docsBasename = `${hostingBase}docs`;
