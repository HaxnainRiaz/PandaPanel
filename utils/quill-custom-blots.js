export function registerCustomBlots(Quill) {
    // Check if StyledQuoteBlot is already registered to avoid re-registration issues
    // or just overwrite.

    const Block = Quill.import('blots/block');

    class StyledQuoteBlot extends Block {
        static create(value) {
            const node = super.create();
            node.setAttribute('class', 'styled-quote-block');

            // Debugging
            console.log('StyledQuoteBlot create:', value);

            // If value is an object (style config), apply it
            if (value && typeof value === 'object') {
                StyledQuoteBlot.applyStyles(node, value);
                // Store configuration for persistence
                node.setAttribute('data-quote-style', JSON.stringify(value));
            }
            return node;
        }

        static formats(node) {
            // Recover style object from data attribute during initialization
            if (node.hasAttribute('data-quote-style')) {
                try {
                    return JSON.parse(node.getAttribute('data-quote-style'));
                } catch (e) {
                    return true; // Fallback
                }
            }
            return true;
        }

        static applyStyles(node, style) {
            Object.keys(style).forEach(key => {
                node.style[key] = style[key];
            });
        }
    }

    StyledQuoteBlot.blotName = 'styled-quote';
    StyledQuoteBlot.tagName = 'blockquote';
    StyledQuoteBlot.className = 'styled-quote-block';

    // Register with overwrite=true
    Quill.register(StyledQuoteBlot, true);
    // console.log('StyledQuoteBlot registered');

    // Also register the format name to allow it in Delta
    // Quill usually infers from blotName, but good to be explicit if needed.
    // Actually Quill.register(blot) handles it.
}
