import { PROVIDERS_LIST } from '@consumet/extensions';
import { FastifyRequest, FastifyReply, FastifyInstance, RegisterOptions } from 'fastify';

type ProvidersRequest = FastifyRequest<{
  Querystring: { type: keyof typeof PROVIDERS_LIST };
}>;

// ---- OPTIONAL: hard remove AnimeOwl globally at startup
// (Safe if PROVIDERS_LIST.ANIME exists; no-op otherwise)
try {
  const anyList: any = PROVIDERS_LIST as any;
  if (anyList?.ANIME?.AnimeOwl) {
    delete anyList.ANIME.AnimeOwl;
  }
} catch { /* ignore */ }

// Helper to filter out AnimeOwl constructors by class name
const isBlocked = (ctor: any) => {
  const n = (ctor?.name ?? '').toLowerCase();
  return n === 'animeowl' || n.includes('animeowl');
};

export default class Providers {
  public getProviders = async (fastify: FastifyInstance, options: RegisterOptions) => {
    fastify.get(
      '/providers',
      {
        preValidation: (request, reply, done) => {
          const { type } = request.query;

          const providerTypes = Object.keys(PROVIDERS_LIST);

          if (type === undefined) {
            reply.status(400);
            return done(
              new Error(
                'Type must not be empty. Available types: ' + providerTypes.toString(),
              ),
            );
          }

          if (!providerTypes.includes(type)) {
            reply.status(400);
            return done(new Error('Type must be either: ' + providerTypes.toString()));
          }

          done();
        },
      },
      async (request: ProvidersRequest, reply: FastifyReply) => {
        const { type } = request.query;

        // Get constructors, drop AnimeOwl, sort by class name
        const providers = (Object.values(PROVIDERS_LIST[type]) as any[])
          .filter((ctor) => !isBlocked(ctor))
          .sort((a, b) => String(a?.name).localeCompare(String(b?.name)));

        // NOTE: your original code returned element.toString (a function pointer).
        // Return readable names instead.
        reply.status(200).send(providers.map((ctor) => ctor?.name ?? 'Unknown'));
      },
    );
  };
}
