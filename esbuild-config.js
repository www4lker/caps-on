const { Plugin } = require('obsidian');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = 'build';

// Configuração do esbuild
require('esbuild').build({
	entryPoints: ['main.ts'],
	bundle: true,
	external: ['obsidian', 'electron'],
	format: 'cjs',
	watch: process.argv.includes('--watch'),
	target: 'es2016',
	logLevel: 'info',
	sourcemap: 'inline',
	treeShaking: true,
	outfile: 'main.js',
}).catch(() => process.exit(1));