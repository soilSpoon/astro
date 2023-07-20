import { createResolve } from './resolve.js';
import type { ModuleLoader } from '../core/module-loader';
import type { AstroSettings, RuntimeMode, SSRManifest } from '../@types/astro.js';
import type { LogOptions } from '../core/logger/core.js';
import { createEnvironment, type Environment } from '../core/render/index.js';
import { RouteCache } from '../core/render/route-cache.js';
import { isServerLikeOutput } from '../prerender/utils.js';

export type DevelopmentEnvironment = Environment & {
	loader: ModuleLoader;
	settings: AstroSettings;
};

export function createDevelopmentEnvironment(
	manifest: SSRManifest,
	settings: AstroSettings,
	logging: LogOptions,
	loader: ModuleLoader
): DevelopmentEnvironment {
	const mode: RuntimeMode = 'development';
	let env = createEnvironment({
		adapterName: manifest.adapterName,
		logging,
		markdown: manifest.markdown,
		mode,
		// This will be overridden in the dev server
		renderers: [],
		clientDirectives: manifest.clientDirectives,
		compressHTML: manifest.compressHTML,
		resolve: createResolve(loader, settings.config.root),
		routeCache: new RouteCache(logging, mode),
		site: manifest.site,
		ssr: isServerLikeOutput(settings.config),
		streaming: true,
	});

	return {
		...env,
		loader,
		settings,
	};
}
