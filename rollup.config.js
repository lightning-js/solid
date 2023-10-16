import withSolid from 'rollup-preset-solid';

export default withSolid({
  solidOptions: {
    moduleName: '@lightningjs/solid',
    generate: 'universal',
    contextToCustomElements: false,
  },
});
