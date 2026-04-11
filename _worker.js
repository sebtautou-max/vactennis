export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Redirection www → non-www
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      return Response.redirect(url.toString(), 301);
    }

    // Continuer normalement (servir les assets statiques)
    return env.ASSETS.fetch(request);
  }
};
