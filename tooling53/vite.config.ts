import { defineConfig } from 'vite';
import path from 'node:path';
// Keep web and native-host code separate; do not replace the existing CEP runtime.
export default defineConfig({root:path.resolve('../Varna_Motion_Studio'),server:{host:'127.0.0.1',port:5173,strictPort:true,proxy:{'/api':'http://127.0.0.1:8794'}},build:{outDir:'../tooling53/dist',emptyOutDir:true,rollupOptions:{input:{ae:'editor.html',shared:'plugin.html',premiere:'premiere.html'}}}});
