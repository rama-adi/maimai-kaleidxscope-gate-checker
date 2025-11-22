// Improved build script with simplified flow and helpful logging
import { rm, stat } from "node:fs/promises";
import tailwind from "bun-plugin-tailwind";

const CF_PAGE_URL = "https://gate.onebyteworks.my.id";
const VER = Math.floor(Date.now() / 1000);

const BOOKMARKLET_FILE = `bookmarklet.js`;
const USERSCRIPT_FILE = `userscript_${VER}.user.js`;
const BOOKMARKLET_CODE = `javascript:(function(d){if(d.location.origin==='https://maimaidx-eng.com'){var s=d.createElement('script');s.src='${CF_PAGE_URL}/${BOOKMARKLET_FILE}?t='+Math.floor(Date.now()/60000);d.body.append(s);}})(document)`;

// --- Logger ---
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
    bold: "\x1b[1m"
};

const log = {
    info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg: string) => console.log(`${colors.green}✔${colors.reset} ${msg}`),
    warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg: string) => console.log(`${colors.red}✖${colors.reset} ${msg}`),
    sub: (msg: string) => console.log(`${colors.gray}  └ ${msg}${colors.reset}`)
};

// --- Helpers ---

function normalizeTailwind(css: string): string {
    return css
        .replace(/:root\b/g, ':host')
        .replaceAll('((-webkit-hyphens:none)) and ', '')
        .replaceAll('(-webkit-hyphens: none) and ', '');
}

function escapeForJsString(str: string): string {
    return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "");
}

async function ensureCleanDist() {
    log.info("Cleaning dist folder...");
    try {
        await stat("dist");
        await rm("dist", { recursive: true, force: true });
        log.sub("Removed existing dist folder");
    } catch (err: any) {
        if (err.code !== 'ENOENT') throw err;
        log.sub("Dist folder not found, skipping removal");
    }
}

async function buildHomepage() {
    log.info("Building homepage...");
    await Bun.build({ entrypoints: ['./index.html'], outdir: "dist" });
    log.sub("Homepage built");
}

async function build(entrypoint: string) {
    log.info(`Building ${entrypoint}...`);
    const result = await Bun.build({
        entrypoints: [entrypoint],
        target: 'browser',
        format: 'iife',
        minify: true,
        plugins: [tailwind],
        jsx: { importSource: "preact", runtime: "automatic" },
        tsconfig: "bookmarklet/tsconfig.json"
    });

    if (!result.success) {
        throw new Error(`${entrypoint} build failed: ` + result.logs.join("\n"));
    }

    const js = await result.outputs[0]?.text();
    const css = await result.outputs[1]?.text();

    if (!js || !css) throw new Error(`${entrypoint} build missing outputs`);

    return { js, css };
}

async function processBookmarklet(buildResult: { js: string, css: string }) {
    const { js, css } = buildResult;
    const tailwindStr = escapeForJsString(normalizeTailwind(css));
    const patched = js.replace("%%TAILWIND_STYLES%%", tailwindStr);

    await Bun.write(`dist/${BOOKMARKLET_FILE}`, patched);
    log.success(`Generated dist/${BOOKMARKLET_FILE}`);
}

async function processUserScript(buildResult: { js: string, css: string }) {
    let template = await Bun.file("userscript-template.ts").text();
    template = template.replace(/{VER}/g, VER.toString());

    const { js, css } = buildResult;
    template = template.replace(/\/\/ <CODE>/g, js);

    const cssStr = escapeForJsString(css);
    template = template.replace("%%TAILWIND_STYLES%%", cssStr);

    await Bun.write(`dist/${USERSCRIPT_FILE}`, template);
    log.success(`Generated dist/${USERSCRIPT_FILE}`);
}

async function copyAssets() {
    log.info("Copying assets...");
    const ogp = Bun.file("pics/ogp.png");
    await Bun.write(`dist/ogp_${VER}.png`, ogp);
    log.sub(`Copied ogp_${VER}.png`);
}

async function patchIndexHtml() {
    log.info("Patching index.html...");
    let html = await Bun.file("dist/index.html").text();

    html = html
        .replace(/\{VER\}/g, VER.toString())
        .replace(/\{BOOKMARKCODE\}/g, BOOKMARKLET_CODE)
        .replace(/\{OGIMG\}/g, `${CF_PAGE_URL}/ogp_${VER}.png`)
        .replace(/\{USERSCRIPTURL\}/g, `${CF_PAGE_URL}/${USERSCRIPT_FILE}`);

    await Bun.write("dist/index.html", html);
    log.success("Patched dist/index.html");
}

async function main() {
    console.log(`\n${colors.bold}💜 Lavender Haze Build Pipeline${colors.reset}\n`);

    await ensureCleanDist();
    await buildHomepage();

    // Run builds in parallel
    const [bookmarkletBuild, userscriptBuild] = await Promise.all([
        build("bookmarklet/lavenderhaze.tsx"),
        build("bookmarklet/userscript.tsx")
    ]);

    await copyAssets();

    // Process outputs
    await Promise.all([
        processBookmarklet(bookmarkletBuild),
        processUserScript(userscriptBuild)
    ]);

    await patchIndexHtml();

    console.log(`\n${colors.green}${colors.bold}Build completed successfully!${colors.reset}\n`);
}

main().catch(err => {
    log.error("Build failed:");
    console.error(err);
    process.exit(1);
});
