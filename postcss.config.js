// postcss.config.js
import autoprefixer from 'autoprefixer';
import tailwindcss_plugin from '@tailwindcss/postcss'; // Import the new plugin

export default {
	plugins: [
		autoprefixer(),
		tailwindcss_plugin() // Use the new plugin
	]
};
