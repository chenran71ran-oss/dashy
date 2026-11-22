/**
 * Serves YAML config files from the user data directory, behind auth if enabled
 */
const path = require('path');
const { maybeBootstrapConfig } = require('../utils/auth-oidc');

const rootDir = path.join(__dirname, '..', '..');

/* Returns the YAML file a request is for (including Windows aliases), or null */
const yamlFilename = (req) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return null;
  let file;
  try { file = path.normalize(decodeURIComponent(req.path)); } catch (e) { return null; }
  return /\.(ya?ml|yam)(:|$)/i.test(file) ? path.basename(file) : null;
};

module.exports = ({ bootstrapAuth, authIsConfigured, guestAccessOn }) => {
  const userDataDir = path.resolve(rootDir, process.env.USER_DATA_DIR || 'user-data');

  const serve = (req, res, file) => {
    if (authIsConfigured) {
      res.set('Cache-Control', 'private, no-store').set('Vary', 'Authorization');
      try {
        const stripped = maybeBootstrapConfig(path.resolve(userDataDir, file), {
          isRootConfig: file === 'conf.yml',
          isAuthenticated: Boolean(req.auth),
          guestAccessOn,
        });
        if (stripped) return res.type('text/yaml').send(stripped);
      } catch (e) {
        console.warn(`Failed to read or parse ${file}`, e);
        return res.status(500).json({ success: false, message: 'Could not read config' });
      }
      // Not authenticated, not main conf.yml
      if (!req.auth && !guestAccessOn) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
    }
    return res.sendFile(file, { root: userDataDir }, (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ success: false, message: `Could not read ${file}` });
      }
    });
  };

  return (req, res, next) => {
    const file = yamlFilename(req);
    if (!file) return next();
    return bootstrapAuth(req, res, (err) => (err ? next(err) : serve(req, res, file)));
  };
};
