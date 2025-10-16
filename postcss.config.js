const config = {
  plugins: [
    require('postcss-import'),
    require('autoprefixer'),
    require('postcss-nested'),
    require('postcss-simple-vars'),
    require('postcss-custom-media'),
    process.env.NODE_ENV === 'production' ?
        require('cssnano')({preset: 'default'})
    :
        null
  ]
}

module.exports = config