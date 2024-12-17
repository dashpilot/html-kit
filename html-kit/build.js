const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

let stylesSet = new Set();
let scriptsSet = new Set();

function processIncludes(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const includeRegex = /{{include\s+"(.*?)"}}/g;

    content = content.replace(includeRegex, (match, relativePath) => {
        const componentPath = path.join(__dirname, '..', 'src', relativePath); // Resolve path from the src directory
        if (fs.existsSync(componentPath)) {
            return processIncludes(componentPath);
        } else {
            console.error(`Component file not found: ${componentPath}`);
            return match;
        }
    });

    // Extract styles and scripts
    const styleRegex = /<style>([\s\S]*?)<\/style>/gi;
    const scriptRegex = /<script>([\s\S]*?)<\/script>/gi;

    content = content.replace(styleRegex, (match, styleContent) => {
        stylesSet.add(styleContent.trim());
        return ''; // Remove the style tag from the content
    });

    content = content.replace(scriptRegex, (match, scriptContent) => {
        scriptsSet.add(scriptContent.trim());
        return ''; // Remove the script tag from the content
    });

    return content;
}

async function build() {
    try {
        // Ensure the public directory exists
        const publicDir = path.join(__dirname, '..', 'public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        // Process the source HTML file
        const srcFilePath = path.join(__dirname, '..', 'src', 'index.html');
        const htmlContent = processIncludes(srcFilePath);

        // Write the processed HTML to the public directory
        const outputFilePath = path.join(publicDir, 'index.html');
        fs.writeFileSync(outputFilePath, htmlContent, 'utf-8');

        // Minify and write the extracted styles to a file
        const minifiedCss = new CleanCSS().minify(Array.from(stylesSet).join('\n')).styles;
        const componentsCssPath = path.join(publicDir, 'components.css');
        fs.writeFileSync(componentsCssPath, minifiedCss, 'utf-8');
        // console.log('Components CSS written to public/components.css');

        // Minify and write the extracted scripts to a file
        const scriptsContent = Array.from(scriptsSet).join('\n');
        // console.log('Scripts content before minification:', scriptsContent); // Log the scripts content

        if (!scriptsContent.trim()) {
            console.error('No JavaScript content found to minify.');
            return;
        }

        // Use Terser to minify the JavaScript
        const minifiedJsResult = await minify(scriptsContent, {
            ecma: 5, // Specify ECMAScript version
            compress: true,
            mangle: true,
        });

        if (minifiedJsResult.error) {
            console.error('Error during JS minification:', minifiedJsResult.error);
            return;
        }

        const minifiedJs = minifiedJsResult.code;
        if (!minifiedJs) {
            console.error('Minification resulted in undefined code.');
            return;
        }

        const componentsJsPath = path.join(publicDir, 'components.js');
        fs.writeFileSync(componentsJsPath, minifiedJs, 'utf-8');
        console.log('Components JS written to public/components.js');

        // Copy the CSS file to the public directory
        const srcCssPath = path.join(__dirname, '..', 'src', 'style.css');
        const destCssPath = path.join(publicDir, 'style.css');
        if (fs.existsSync(srcCssPath)) {
            fs.copyFileSync(srcCssPath, destCssPath);
            console.log('CSS file copied to public/style.css');
        } else {
            console.error('CSS file not found: src/style.css');
        }

        console.log('Build complete. Output written to public/index.html');
    } catch (error) {
        console.error('Error during build:', error);
    }
}

// Set up WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

function notifyClients() {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send('reload');
        }
    });
}

// Watch the src directory for changes
function watchSrcDirectory() {
    const srcDir = path.join(__dirname, '..', 'src');
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
        if (filename) {
            console.log(`File changed: ${filename}`);
            build(); // Re-run the build process on changes
            notifyClients(); // Notify clients after build
        }
    });

    console.log('Watching for changes in src directory...');
}

// Execute build and start watching
build();
watchSrcDirectory();
