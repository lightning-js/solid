import withSolid from 'rollup-preset-solid';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default withSolid(
  {
    solidOptions: {
      moduleName: '@lightningjs/solid',
      generate: 'universal',
      contextToCustomElements: false,
    },
    plugins: [
      nodeResolve(),
      replace({
        'import.meta.env.MODE': '"production"',
        preventAssignment: true,
      }),
      alias({
        entries: [
          { find: '@lightningjs/core', replacement: '../core' },
          { find: '@activeElement', replacement: './activeElement.js' },
        ],
      }),
    ],
  },
  {
    preserveModules: true,
    preserveModulesRoot: './',
  },
);
