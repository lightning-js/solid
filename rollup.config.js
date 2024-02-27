import withSolid from 'rollup-preset-solid';
import replace from '@rollup/plugin-replace';

export default withSolid(
  {
    solidOptions: {
      moduleName: '@lightningjs/solid',
      generate: 'universal',
      contextToCustomElements: false,
    },
    plugins: [
      replace({
        'import.meta.env.MODE': '"production"',
        preventAssignment: true,
      }),
    ],
  },
  {
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
);
