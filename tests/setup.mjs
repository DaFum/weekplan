import { JSDOM } from "jsdom";

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "test";
} else {
    process.env.NODE_ENV = "test";
}

export function createTestDOM(markup = "<!DOCTYPE html><body></body>") {
    const dom = new JSDOM(markup, { url: "http://localhost" });

    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.HTMLInputElement = dom.window.HTMLInputElement;
    globalThis.Node = dom.window.Node;

    return dom;
}
