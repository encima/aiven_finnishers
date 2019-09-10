import svelte from 'rollup-plugin-svelte';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
	{
		input: 'src/main.js',
		output: {
			customElement: true,
			sourcemap: true,
			format: 'iife',
			name: 'app',
			dir: 'public/bundle'
		},
		plugins: [
			svelte({
				dev: !production,
				css: css => {
					css.write('public/bundle/style.css');
				}
			}),
			resolve(),
			commonjs(),
			production && terser()
		]
	},
];
