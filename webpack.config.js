var webpack = require("webpack");

var PROD = parseInt(process.env.BUILD_MIN || '0');

module.exports = {
    entry: "./index.ts",
    output: {
        filename: PROD ? "sc-network.min.js" : "sc-network.js",
        path: __dirname + "/build",
        libraryTarget: 'umd'
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".js"]
    },

    plugins: PROD ? [
        new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
    ] : [],
    
    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            { test: /\.tsx?$/, loader: "awesome-typescript-loader" },
             {
                test: /\.css$/,
                use: [
                "style-loader",
                {
                    loader: "css-loader",
                    options: {
                    modules: true,
                    sourceMap: true,
                    importLoaders: 1,
                    localIdentName: "[name]--[local]--[hash:base64:8]"
                    }
                },
                "postcss-loader" // has separate config, see postcss.config.js nearby
                ]
            },
            { test: /\.less$/, loader: 'style-loader!css-loader!less-loader'},

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
    },
};