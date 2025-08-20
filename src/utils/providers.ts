import { PROVIDERS_LIST, ANIME } from '@consumet/extensions';

// Remove AnimeOwl from all known maps and poison any lingering method
(function nukeAnimeOwl() {
  try {
    const roots: any[] = [PROVIDERS_LIST as any, ANIME as any];
    for (const root of roots) {
      if (!root) continue;

      // Obvious top-level
      if (root.AnimeOwl) delete root.AnimeOwl;
      if (root.ANIME?.AnimeOwl) delete root.ANIME.AnimeOwl;

      // Walk nested containers like PROVIDERS_LIST.ANIME
      for (const typeKey of Object.keys(root)) {
        const container = root[typeKey];
        if (!container || typeof container !== 'object') continue;

        for (const provKey of Object.keys(container)) {
          const ctor = container[provKey];
          const name = String(ctor?.name ?? provKey).toLowerCase();
          if (name.includes('animeowl')) {
            delete container[provKey];
          }
        }
      }
    }

    // Poison prototype in case something already captured the ctor
    const Owl = (ANIME as any)?.AnimeOwl;
    if (Owl?.prototype) {
      for (const k of Object.getOwnPropertyNames(Owl.prototype)) {
        if (typeof Owl.prototype[k] === 'function') {
          Owl.prototype[k] = async () => {
            throw new Error('AnimeOwl disabled by server config');
          };
        }
      }
    }
  } catch (_) {
    // ignore
  }
})();
