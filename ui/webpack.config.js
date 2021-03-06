const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')

module.exports = {
    entry: './src/app.js',
    output: {
        filename: 'built.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'dist'),
        environment: {
            arrowFunction: false,
            bigIntLiteral: false,
            const: false,
            destructuring: false,
            dynamicImport: false,
            forOf: false,
            module: false
        }
    },
    module: {
        rules: [
            {test: /\.html$/, use: 'html-loader'},
            {test: /\.(png|woff|woff2|eot|ttf|svg)$/, type: 'asset/inline'},
            {test: /\.s?css$/, use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader']},
            {
                test: /\.m?js$/,
                use: process.env.NODE_ENV === 'production' ? ['babel-loader'] : [],
                exclude: /(node_modules|bower_components)/
            }
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/')
        }
    },
    plugins: [
        new CleanWebpackPlugin({
            dry: process.env.NODE_ENV !== 'production',
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
            new TerserWebpackPlugin()
        ],
    }
}
