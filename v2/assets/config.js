/**
 * Runtime configuration.
 *
 * endpoint: null means the analytics layer is fully disabled. No request is
 * ever made, no script is loaded, nothing is stored. Set this to a URL you
 * control to switch the five defined events on. See /events/ for the schema.
 *
 * Why null by default: GitHub Pages is static and cannot host an endpoint
 * (FLG-006), and we will not point at somebody else's analytics service
 * without that being a deliberate, disclosed decision (SG-02).
 */
window.WINA_CONFIG = {
  endpoint: null,
  site: 'countertop-report',
  version: '1.0.0',
  // Honour these; if either is set, send nothing.
  respectDoNotTrack: true,
  respectGlobalPrivacyControl: true
};
