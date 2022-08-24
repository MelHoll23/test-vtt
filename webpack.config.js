module.exports = {
    context: __dirname,
    mode: 'production',
    entry: './scripts/index.js',
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['scripts', 'node_modules']
    }
}