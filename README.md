# html-kit

Html-kit is a nodejs build script to give plain html superpowers. It adds:

-   **html includes** - you can now simply include other HTML files/partials into your index.html
-   **html components** - each partial can contain css and js which is split out into separate components.css and components.js files. So you can use html, css and js in one file.

Take a look at `src/index.html` and `src/components.html` to see how (simple) it all works.

## HTML includes

To include a file:

```
{{include "components/my-component.html"}}
```

# How to install?

You can download this repo, and use it as the basis for your new project, or you can use Degit to download the files to your current working directory:

```
npm install -g degit

degit https://github.com/dashpilot/html-kit
npm install
npm run dev
```
