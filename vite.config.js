import path from "path"
import glsl from "vite-plugin-glsl"
import viteCompression from "vite-plugin-compression"
import { fileURLToPath } from "url"
import { defineConfig } from 'vite';

const fileName = fileURLToPath(import.meta.url)
const dirName = path.dirname(fileName)

export default defineConfig({
	base: './',
	// root: 'src',
	// publicDir: '../public',
	build: {
		outDir: '../build',
		emptyOutDir: true,
	},
	resolve: {
		alias: [
			{ find: "three", replacement: dirName + "/node_modules/three" },
			{ find: "postprocessing", replacement: dirName + "/node_modules/postprocessing" }
		]
	},
	server: {
		fs: {
			allow: [".."]
		}
	},
	plugins: [glsl.default(), viteCompression({ algorithm: "brotliCompress" })],
});
