/**
 * 🖋️ Quill Content Utility
 * Handles conversion between HTML and Delta formats for cross-platform compatibility.
 */

export const loadQuillContent = (content) => {
    if (!content) return "";

    // 🖋️ Detect Delta JSON
    if (typeof content === 'string' && (content.trim().startsWith('[') || content.trim().startsWith('{'))) {
        try {
            const parsed = JSON.parse(content);
            // ReactQuill value can be a Delta object { ops: [...] }
            return { ops: Array.isArray(parsed) ? parsed : (parsed.ops || []) };
        } catch (e) {
            console.error("Delta Parse Error:", e);
            return content;
        }
    }

    return content; // Likely existing HTML
};


