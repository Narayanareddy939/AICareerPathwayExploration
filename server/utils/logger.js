/**
 * Application Logger Utility
 */

const info = (msg, meta = '') => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [INFO]  ${msg}`, meta ? meta : '');
};

const warn = (msg, meta = '') => {
  const ts = new Date().toISOString();
  console.warn(`[${ts}] [WARN]  ${msg}`, meta ? meta : '');
};

const error = (msg, meta = '') => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [ERROR] ${msg}`, meta ? meta : '');
};

const debug = (msg, meta = '') => {
  if (process.env.NODE_ENV !== 'production') {
    const ts = new Date().toISOString();
    console.debug(`[${ts}] [DEBUG] ${msg}`, meta ? meta : '');
  }
};

module.exports = { info, warn, error, debug };
