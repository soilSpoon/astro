import type { AstroConfig, AstroIntegration, AstroRenderer } from 'astro';
import solid from 'vite-plugin-solid';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/solid-js',
		clientEntrypoint: '@astrojs/solid-js/client.js',
		serverEntrypoint: '@astrojs/solid-js/server.js',
	};
}

async function getViteConfiguration(isDev: boolean) {
	return {
		plugins: [solid({dev: isDev, ssr: true})]
	};
}

export default function (): AstroIntegration {
	return {
		name: '@astrojs/solid-js',
		hooks: {
			'astro:config:setup': async ({ command, addRenderer, updateConfig, config }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: await getViteConfiguration(command === 'dev') });
			},
		},
	};
}
