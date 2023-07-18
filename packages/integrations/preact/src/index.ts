import type { AstroIntegration, AstroRenderer, ViteUserConfig } from 'astro';
import preact from "@preact/preset-vite";

function getRenderer(development: boolean): AstroRenderer {
	return {
		name: '@astrojs/preact',
		clientEntrypoint: development ? '@astrojs/preact/client-dev.js' : '@astrojs/preact/client.js',
		serverEntrypoint: '@astrojs/preact/server.js',
	};
}

function getViteConfiguration(compat?: boolean): ViteUserConfig {
	return {
		plugins: [preact()],
		optimizeDeps: {
			include: ['@astrojs/preact/client.js', 'preact', 'preact/jsx-runtime'],
			exclude: ['@astrojs/preact/server.js'],
		},
	};
}

export default function ({ compat }: { compat?: boolean } = {}): AstroIntegration {
	return {
		name: '@astrojs/preact',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig, command }) => {
				addRenderer(getRenderer(command === 'dev'));
				updateConfig({
					vite: getViteConfiguration(compat),
				});
			},
		},
	};
}
