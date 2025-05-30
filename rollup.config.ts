// rollup.config.ts
import typescript  from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs    from '@rollup/plugin-commonjs'
import terser      from '@rollup/plugin-terser'

const treeshake = {
	moduleSideEffects       : false,
	propertyReadSideEffects : false,
	tryCatchDeoptimization  : false
}

const onwarn = warning => {
  if (
    warning.code === 'INVALID_ANNOTATION' && 
    warning.message.includes('@__PURE__')
  ) {
    return
  }
  if (
    warning.code === 'MIXED_EXPORTS' &&
    warning.message.includes('zod')
  ) {
    return
  }
  throw new Error(warning)
}

export default {
  input: 'src/index.ts',
  onwarn,
  output: [
    {
      file: 'dist/main.cjs',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    {
      file: 'dist/module.mjs',
      format: 'es',
      sourcemap: true,
      minifyInternalExports: true,
      exports: 'named'
    },
    {
      file: 'dist/browser.js',
      format: 'iife',
      name: 'btcdev',
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [ typescript(), nodeResolve(), commonjs() ],
  strictDeprecations: true,
  treeshake
}
