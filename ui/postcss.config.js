const cssnano = require('cssnano')

module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        cssnano({preset: ['default', {discardComments: {removeAll: true}}]})
    ]
}
