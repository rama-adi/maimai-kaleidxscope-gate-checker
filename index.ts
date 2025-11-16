import { rm, stat } from "node:fs/promises";
import tailwind from "bun-plugin-tailwind"

// im really sorry :(
const CF_PAGE_URL = "https://gate.onebyteworks.my.id";
const VER = Math.floor(Date.now() / 1000);

const BOOKMARKLET_FILE = `bookmarklet_${VER}.js`
const BOOKMARKLET_CODE = `javascript:(function(d){if(['https://maimaidx-eng.com'].indexOf(d.location.origin)>=0){var s=d.createElement('script');s.src='${CF_PAGE_URL}/${BOOKMARKLET_FILE}?t='+Math.floor(Date.now()/60000);d.body.append(s);}})(document)`;

try {
    await stat("dist");
    // If no error, dist exists – remove it
    await rm("dist", { recursive: true, force: true });
} catch (err: any) {
    if (err.code !== 'ENOENT') throw err; // if error not "not exists", rethrow
    // If ENOENT, dist did not exist – that's fine.
}

// load the homepage
await Bun.build({
    plugins: [tailwind],
    entrypoints: ['./index.html'],
    outdir: "dist"
});

const bookmarklet = await Bun.build({
    entrypoints: ['./lavenderhaze.tsx'],
    target: 'browser', // default,
    format: 'iife',
    minify: true
});

// Copy pics/ogp.png to dist/ogp.png using Bun's file/stream utilities
const ogpSource = Bun.file("pics/ogp.png");
await Bun.write(`dist/ogp_${VER}.png`, ogpSource);


const text = await bookmarklet.outputs[0]?.text();
await Bun.write(`dist/${BOOKMARKLET_FILE}`, text ?? "");


// Load the generated index.html from dist, replace version and bookmarklet code placeholders, and write back.
let html = await Bun.file("dist/index.html").text();

// Do the replacements
html = html
    .replace(/\{VER\}/g, VER.toString())
    .replace(/\{BOOKMARKCODE\}/g, BOOKMARKLET_CODE)
    .replace(/\{OGIMG\}/g, `${CF_PAGE_URL}/ogp_${VER}.png`);

// Write the result back
await Bun.write("dist/index.html", html);
