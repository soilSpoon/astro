import type fs from 'node:fs';
import type * as vite from 'vite';
import type { AstroSettings, ManifestData, SSRManifest } from '../@types/astro';
import { patchOverlay } from '../core/errors/overlay.js';
import type { LogOptions } from '../core/logger/core.js';
import { createViteLoader } from '../core/module-loader/index.js';
import { createDevelopmentEnvironment } from './environment.js';
import { createRouteManifest } from '../core/routing/index.js';
import { baseMiddleware } from './base.js';
import { createController } from './controller.js';
import { handleRequest } from './request.js';

export interface AstroPluginOptions {
	settings: AstroSettings;
	logging: LogOptions;
	fs: typeof fs;
}

export default function createVitePluginAstroServer({
	settings,
	logging,
	fs: fsMod,
}: AstroPluginOptions): vite.Plugin {
	return {
		name: 'astro:server',
		configureServer(viteServer) {
			const loader = createViteLoader(viteServer);
			const manifest = createDevelopmentManifest(settings);
			const env = createDevelopmentEnvironment(manifest, settings, logging, loader);
			let manifestData: ManifestData = createRouteManifest({ settings, fsMod }, logging);
			const controller = createController({ loader });

			/** rebuild the route cache + manifest, as needed. */
			function rebuildManifest(needsManifestRebuild: boolean) {
				env.routeCache.clearAll();
				if (needsManifestRebuild) {
					manifestData = createRouteManifest({ settings }, logging);
				}
			}
			// Rebuild route manifest on file change, if needed.
			viteServer.watcher.on('add', rebuildManifest.bind(null, true));
			viteServer.watcher.on('unlink', rebuildManifest.bind(null, true));
			viteServer.watcher.on('change', rebuildManifest.bind(null, false));

			return () => {
				// Push this middleware to the front of the stack so that it can intercept responses.
				if (settings.config.base !== '/') {
					viteServer.middlewares.stack.unshift({
						route: '',
						handle: baseMiddleware(settings, logging),
					});
				}
				// Note that this function has a name so other middleware can find it.
				viteServer.middlewares.use(async function astroDevHandler(request, response) {
					if (request.url === undefined || !request.method) {
						response.writeHead(500, 'Incomplete request');
						response.end();
						return;
					}
					handleRequest({
						env,
						manifestData,
						controller,
						incomingRequest: request,
						incomingResponse: response,
						manifest,
					});
				});
			};
		},
		transform(code, id, opts = {}) {
			if (opts.ssr) return;
			if (!id.includes('vite/dist/client/client.mjs')) return;

			// Replace the Vite overlay with ours
			return patchOverlay(code);
		},
	};
}

/**
 * It creates a `SSRManifest` from the `AstroSettings`.
 *
 * Renderers needs to be pulled out from the page module emitted during the build.
 * @param settings
 * @param renderers
 */
export function createDevelopmentManifest(settings: AstroSettings): SSRManifest {
	return {
		compressHTML: settings.config.compressHTML,
		assets: new Set(),
		entryModules: {},
		routes: [],
		adapterName: '',
		markdown: settings.config.markdown,
		clientDirectives: settings.clientDirectives,
		renderers: [],
		base: settings.config.base,
		assetsPrefix: settings.config.build.assetsPrefix,
		site: settings.config.site
			? new URL(settings.config.base, settings.config.site).toString()
			: settings.config.site,
		componentMetadata: new Map(),
	};
}
