const config = {
  projectName: 'taro-demo',
  date: '2020-4-5',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [],
  compiler: {
    type: 'webpack5'
  },
  defineConstants: {},
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  mini: {
    webpackChain(chain) {
      chain.optimization.usedExports(false)
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024 // 设定转换尺寸上限
        }
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  },
  h5: {
    publicPath: './',
    staticDirectory: 'static',
    webpackChain(chain) {
      // taro-h5 4.x 未声明对 plugin-framework-react 的依赖，
      // pnpm 下会回落到根目录被 taro-ui 提升上来的 3.x 版本，导致产物里
      // __TARO_FRAMEWORK__ 未定义。这里显式指向 demo 自己的 4.x。
      chain.resolve.alias.set(
        '@tarojs/plugin-framework-react/dist/runtime',
        require.resolve('@tarojs/plugin-framework-react/dist/runtime')
      )

      // Taro H5 的 script 规则默认只 include 源码目录和「路径里含 taro」的
      // node_modules（见 @tarojs/webpack5-runner H5WebpackModule#getScriptRule）。
      // 工作区内 taro-ui 经 pnpm 软链到 packages/taro-ui/dist，真实路径不含 taro，
      // 于是 taro-ui 里的 Taro.createSelectorQuery / Taro.getSystemInfo 不会被
      // babel-plugin-transform-taroapi 改写，H5 运行时抛 is not a function。
      chain.module
        .rule('script')
        .include.add(require('path').resolve(__dirname, '../../../packages/taro-ui/dist'))
        .end()
    },
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        config: {
          namingPattern: 'module', // 转换模式，取值为 global/module
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      }
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}
