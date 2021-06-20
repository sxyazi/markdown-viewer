const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')

module.exports = {
    entry: './src/app.js',
    output: {
        filename: 'built.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {test: /\.html$/, use: 'html-loader'},
            {test: /\.(png|woff|woff2|eot|ttf|svg)$/, use: 'url-loader?limit=100000'},
            {test: /\.s?css$/, use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']}
        ],
    },
    plugins: [
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
            cleanAfterEveryBuildPatterns: ['*.LICENSE.txt']
        }),
        new HtmlWebpackPlugin({
            inject: process.env.NODE_ENV !== 'production',
            publicPath: '/',
            template: './src/app.html'
        })
    ],
    devServer: {
        proxy: {
            '/forward': 'http://127.0.0.1:3000',
        },
        historyApiFallback: {
            rewrites: [
                {from: /.*/, to: '/index.html'},
            ]
        }
    },
    optimization: {
        minimizer: [
            new TerserWebpackPlugin(),
            new CssMinimizerWebpackPlugin()
        ],
    }
}
