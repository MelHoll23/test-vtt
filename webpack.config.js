const path = require('path')

module.exports = {
    context: __dirname,
    mode: 'production',
    entry: './scripts/index.js',
    output: {
        filename: 'gameboard.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['scripts', 'node_modules']
    }
}