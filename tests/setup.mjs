import { JSDOM } from "jsdom";

process.env.NODE_ENV = "test";

export function createTestDOM(markup = "<!DOCTYPE html><body></body>") {
    const dom = new JSDOM(markup, { url: "http://localhost" });

    const previousGlobals = {
        window: globalThis.window,
        document: globalThis.document,
        HTMLElement: globalThis.HTMLElement,
        HTMLInputElement: globalThis.HTMLInputElement,
        Node: globalThis.Node
    };

    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.HTMLElement = dom.window.HTMLElement;
    globalThis.HTMLInputElement = dom.window.HTMLInputElement;
    globalThis.Node = dom.window.Node;

    const cleanup = () => {
        dom.window.close();

        if (previousGlobals.window === undefined) {
            delete globalThis.window;
        } else {
            globalThis.window = previousGlobals.window;
        }

        if (previousGlobals.document === undefined) {
            delete globalThis.document;
        } else {
            globalThis.document = previousGlobals.document;
        }

        if (previousGlobals.HTMLElement === undefined) {
            delete globalThis.HTMLElement;
        } else {
            globalThis.HTMLElement = previousGlobals.HTMLElement;
        }

        if (previousGlobals.HTMLInputElement === undefined) {
            delete globalThis.HTMLInputElement;
        } else {
            globalThis.HTMLInputElement = previousGlobals.HTMLInputElement;
        }

        if (previousGlobals.Node === undefined) {
            delete globalThis.Node;
        } else {
            globalThis.Node = previousGlobals.Node;
        }
    };

    return { dom, cleanup };
}
