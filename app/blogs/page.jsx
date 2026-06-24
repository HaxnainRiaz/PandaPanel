"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import { SearchBar, Button, Dropdown, Input } from "@/components/ui";
import QuoteModal from "@/components/admin/QuoteModal";
import { Plus, X, Save, ArrowLeft, Trash2, Upload, Image as ImageIcon, Link as LinkIcon, Search, Calendar, User, Clock, Eye, Quote } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <div className="p-10 flex items-center justify-center text-neutral-500">Loading editor...</div> });

import { uploadImage, validateImageFile, resolveImageUrl } from '@/utils/upload';
import { loadQuillContent } from "@/utils/quill";

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
    ],
};

const quillFormats = [
    'header', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'indent',
    'align',
    'link', 'image',
    'styled-quote' // Register our custom format
];

const fontSizes = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px', '60px', '72px'];

export default function BlogsPage() {
    const { blogs, addBlog, updateBlog, deleteBlog, fetchBlogs, loading } = useAdmin();

    useEffect(() => {
        fetchBlogs();
    }, [fetchBlogs]);
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [currentBlog, setCurrentBlog] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [blogToDelete, setBlogToDelete] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
    const [selectedQuoteText, setSelectedQuoteText] = useState("");
    const quillRef = useRef(null);
    const [savedRange, setSavedRange] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Promise.all([
                import('react-quill-new'),
                import('@/utils/quill-custom-blots')
            ]).then(([QuillNamespace, CustomBlots]) => {
                const Quill = QuillNamespace.default.Quill || QuillNamespace.Quill;

                // Register Custom Blots
                CustomBlots.registerCustomBlots(Quill);

                // Register custom font sizes
                const Size = Quill.import('attributors/style/size');
                Size.whitelist = fontSizes;
                Quill.register(Size, true);
            });
        }
    }, []);

    const quillModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                [{ 'size': fontSizes }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['link', 'image', 'quote-box'],
                ['clean']
            ],
            handlers: {
                'quote-box': () => {
                    if (quillRef.current) {
                        const editor = quillRef.current.getEditor();
                        // Get current selection (if any)
                        const range = editor.getSelection();
                        let text = "";
                        if (range && range.length > 0) {
                            text = editor.getText(range.index, range.length);
                        }
                        // Save the range so we can restore it later
                        setSavedRange(range);
                        setSelectedQuoteText(text);
                        setIsQuoteModalOpen(true);
                    }
                }
            }
        }
    }), []);

    const handleInsertQuote = (config) => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            const Quill = editor.constructor;
            const Delta = Quill.import('delta');

            // Debug: Check if format is registered
            // console.log('StyledQuote format:', Quill.imports['formats/styled-quote']);

            // Use saved range if available, otherwise default to current selection or end
            let range = savedRange || editor.getSelection() || { index: editor.getLength(), length: 0 };

            // Create a Delta to update content
            const change = new Delta()
                .retain(range.index)
                .delete(range.length);

            // Handle multi-line quotes
            const lines = config.text.split('\n');
            lines.forEach((line) => {
                change.insert(line);
                // Apply the block format to the newline
                change.insert('\n', { 'styled-quote': config.style });
            });

            editor.updateContents(change, 'user');

            // Move cursor after insertion
            // Total length inserted = text length + number of newlines
            const insertedLength = config.text.length + lines.length;
            editor.setSelection(range.index + insertedLength, 0);

            // Clear saved range
            setSavedRange(null);
        }
    };
    const emptyBlog = {
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1200",
        author: "StorVia Editorial",
        readTime: "5 min read",
        category: "Skincare",
        status: "published",
        isFeatured: false
    };

    const handleEdit = (blog) => {
        setCurrentBlog({ ...blog });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentBlog({ ...emptyBlog });
        setIsEditing(true);
    };

    const confirmDelete = (id) => {
        setBlogToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (blogToDelete) {
            const id = blogToDelete;
            setBlogToDelete(null);
            setIsDeleteModalOpen(false);
            const res = await deleteBlog(id);
            if (res?.success) addToast('Narrative retracted successfully', 'info');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError("");

        // If image is a base64 string and too large, warn user (non-blocking)
        if (currentBlog.image && currentBlog.image.startsWith('data:image') && currentBlog.image.length > 1000000) {
            addToast('Large image detected. Saving may take a moment.', 'info');
        }

        let finalSlug = currentBlog.slug;
        if (!finalSlug && currentBlog.title) {
            finalSlug = currentBlog.title.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        }

        const blogData = {
            ...currentBlog,
            slug: finalSlug
        };

        let res;
        if (currentBlog._id) {
            res = await updateBlog(currentBlog._id, blogData);
        } else {
            res = await addBlog(blogData);
        }

        if (res?.success) {
            setIsEditing(false);
            setCurrentBlog(null);
            addToast(`Article ${currentBlog._id ? 'updated' : 'published'} successfully`, 'success');
        } else {
            setSaveError(res?.message || "Failed to save blog. Please check all fields.");
            addToast('Failed to save article', 'error');
        }
        setIsSaving(false);
    };

    const filteredBlogs = blogs.filter(b =>
        (b?.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b?.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {!isEditing && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-[#0a4019]">Editorial Blogs</h1>
                        <p className="text-[#6B6B6B]">Share skincare wisdom with your community</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <SearchBar
                            placeholder="Search articles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                        <Button
                            onClick={handleAddNew}
                            icon={Plus}
                        >
                            Write Article
                        </Button>
                    </div>
                </div>
            )}

            {isEditing ? (
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] p-8 animate-fadeIn max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#F5F3F0]">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <ArrowLeft size={20} className="text-[#0a4019]" />
                            </button>
                            <h2 className="text-2xl font-heading font-bold text-[#0a4019]">
                                {currentBlog._id ? "Edit Article" : "Compose New Narrative"}
                            </h2>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <Input
                                label="Article Title *"
                                value={currentBlog.title}
                                onChange={(e) => setCurrentBlog({ ...currentBlog, title: e.target.value })}
                                required
                                placeholder="E.g. The Science of Hydration"
                            />

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-[#0a4019] uppercase tracking-wider text-[10px]">Excerpt (Short Summary) *</label>
                                <textarea
                                    value={currentBlog.excerpt}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, excerpt: e.target.value })}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl shadow-sm text-sm"
                                    rows={3}
                                    required
                                    placeholder="A brief teaser to pull readers in..."
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-[#0a4019] uppercase tracking-wider text-[10px]">Main Narrative Content *</label>
                                <div className="quill-premium-wrapper">
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={loadQuillContent(currentBlog.content)}
                                        onChange={(content, delta, source, editor) => {
                                            // Save the Delta JSON string as the single source of truth
                                            const deltaJson = JSON.stringify(editor.getContents().ops);
                                            setCurrentBlog({ ...currentBlog, content: deltaJson });
                                        }}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Begin your narrative here..."
                                        className="bg-white rounded-2xl border border-[#F5F3F0] shadow-sm"
                                    />
                                </div>

                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-[#F5F3F0]/20 p-6 rounded-2xl border border-[#F5F3F0] space-y-4">
                                <label className="block text-sm font-bold text-[#0a4019] uppercase tracking-wider text-[10px]">Article Cover Image</label>
                                <div className="aspect-video rounded-xl overflow-hidden bg-white border border-[#F5F3F0] relative group">
                                    {currentBlog.image && (
                                        <img
                                            src={currentBlog.image.startsWith('blob:') ? currentBlog.image : resolveImageUrl(currentBlog.image)}
                                            alt="Cover"
                                            className={`w-full h-full object-cover ${uploadingImage ? 'opacity-50 blur-sm' : ''} transition-all duration-500`}
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                                        {uploadingImage ? (
                                            <div className="text-center">
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                <p className="text-white text-xs font-bold uppercase tracking-widest">{uploadProgress}%</p>
                                            </div>
                                        ) : (
                                            <label
                                                htmlFor="blog-image-upload"
                                                className="cursor-pointer bg-white text-[#0a4019] px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-100 transition-colors shadow-lg"
                                            >
                                                <Upload size={12} /> Replace Image
                                            </label>
                                        )}
                                        <input
                                            type="file"
                                            id="blog-image-upload"
                                            className="hidden"
                                            disabled={uploadingImage}
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;

                                                // Validate file
                                                const validation = validateImageFile(file);
                                                if (!validation.valid) {
                                                    addToast(`${file.name}: ${validation.error}`, 'error');
                                                    return;
                                                }

                                                // 1. Show Instant Local Preview
                                                const localPreviewUrl = URL.createObjectURL(file);
                                                setCurrentBlog(prev => ({ ...prev, image: localPreviewUrl }));

                                                setUploadingImage(true);
                                                setUploadProgress(0);

                                                try {
                                                    // 2. Perform Backend Upload
                                                    const imageUrl = await uploadImage(file);

                                                    // 3. Finalize with Server URL
                                                    setUploadProgress(100);
                                                    setCurrentBlog(prev => ({ ...prev, image: imageUrl }));

                                                    // Clean up blob URL
                                                    URL.revokeObjectURL(localPreviewUrl);
                                                } catch (error) {
                                                    addToast(`Failed to upload: ${error.message}`, 'error');
                                                    setUploadingImage(false);
                                                } finally {
                                                    setTimeout(() => {
                                                        setUploadingImage(false);
                                                        setUploadProgress(0);
                                                    }, 500);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <Input
                                    label="Image URL"
                                    value={currentBlog.image}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, image: e.target.value })}
                                    className="h-10 text-[10px]"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <Input
                                    label="Slug (URL)"
                                    value={currentBlog.slug}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, slug: e.target.value })}
                                    placeholder="auto-generated-if-empty"
                                />
                                <Dropdown
                                    label="Collection Category"
                                    value={currentBlog.category}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, category: e.target.value })}
                                    options={[
                                        { value: "Skincare Routines ", label: "Skincare Routines" },
                                        { value: "Natural Ingredients", label: "Natural Ingredients" },
                                        { value: "Skincare Problems", label: "Skincare Problems" },
                                        { value: "Healthy Lifestyle", label: "Healthy Lifestyle" },
                                        { value: "Usage Tips", label: "Usage Tips" },
                                    ]}
                                />
                                <Input
                                    label="Author Signature"
                                    value={currentBlog.author}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, author: e.target.value })}
                                />
                                <Input
                                    label="Reading Context (Time)"
                                    value={currentBlog.readTime}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, readTime: e.target.value })}
                                    placeholder="E.g. 5 min read"
                                />
                                <Dropdown
                                    label="Visibility Status"
                                    value={currentBlog.status}
                                    onChange={(e) => setCurrentBlog({ ...currentBlog, status: e.target.value })}
                                    options={[
                                        { value: "published", label: "Published (Visible)" },
                                        { value: "draft", label: "Draft (Hidden)" }
                                    ]}
                                />
                            </div>

                            <div className="bg-[#F5F3F0]/10 p-6 rounded-2xl border border-[#F5F3F0]/30 flex items-center justify-between">
                                <label className="text-sm font-bold text-[#0a4019] uppercase tracking-wider text-[10px]">Featured Article</label>
                                <button
                                    type="button"
                                    onClick={() => setCurrentBlog({ ...currentBlog, isFeatured: !currentBlog.isFeatured })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${currentBlog.isFeatured ? 'bg-[#d3d3d3]' : 'bg-neutral-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${currentBlog.isFeatured ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                            <div className="pt-4 space-y-3">
                                <Button type="submit" disabled={isSaving} className="w-full" icon={isSaving ? null : Save}>
                                    {isSaving ? "Saving..." : "Save Article"}
                                </Button>
                                <Button type="button" onClick={() => setIsEditing(false)} variant="outline" className="w-full">
                                    Discard Article
                                </Button>
                            </div>

                            {/* Admin - View Comments */}
                            {currentBlog._id && currentBlog.comments && currentBlog.comments.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-[#F5F3F0] space-y-4">
                                    <div className="flex items-center gap-2 text-[#0a4019]">
                                        <LinkIcon size={14} className="rotate-45" />
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest">Community Narratives ({currentBlog.comments.length})</h4>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                                        {currentBlog.comments.map((c, i) => (
                                            <div key={i} className="p-4 bg-[#F5F3F0]/20 rounded-xl border border-[#F5F3F0] space-y-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-[#0a4019]">{c.name}</span>
                                                    <span className="text-[8px] text-neutral-400">{format(new Date(c.createdAt), "MMM d")}</span>
                                                </div>
                                                <p className="text-[10px] text-[#6B6B6B] italic">&ldquo;{c.comment}&rdquo;</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div >
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-24">
                            <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[#0a4019] font-heading font-bold animate-pulse">Retrieving Archives...</p>
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="col-span-full text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-[#F5F3F0]">
                            <Search className="mx-auto text-neutral-300 mb-4" size={48} />
                            <p className="text-[#6B6B6B] font-heading italic">No narratives found in the archives.</p>
                        </div>
                    ) : (
                        filteredBlogs.map((blog) => (
                            <div key={blog._id} className="bg-white rounded-[2rem] overflow-hidden border border-[#F5F3F0] hover:shadow-xl transition-all duration-500 group">
                                <div className="aspect-video relative overflow-hidden">
                                    <img src={resolveImageUrl(blog.image)} alt={blog.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                                        <p className="text-[9px] font-bold text-[#0a4019] uppercase tracking-widest">{blog.category}</p>
                                    </div>
                                    {blog.isFeatured && (
                                        <div className="absolute top-4 right-4 bg-[#d3d3d3] text-[#0a4019] px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm">
                                            <Star size={10} fill="currentColor" />
                                            <p className="text-[9px] font-bold uppercase tracking-widest">Featured</p>
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center gap-4 mb-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {format(new Date(blog.createdAt), "MMM d, yyyy")}</span>
                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {blog.readTime}</span>
                                    </div>
                                    <h3 className="text-lg font-heading font-bold text-[#0a4019] mb-2 line-clamp-1 group-hover:text-[#d3d3d3] transition-colors">{blog.title}</h3>
                                    <p className="text-xs text-[#6B6B6B] line-clamp-2 italic mb-6">{blog.excerpt}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#F5F3F0]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#d3d3d3]/20 flex items-center justify-center">
                                                <User size={12} className="text-[#0a4019]" />
                                            </div>
                                            <span className="text-[10px] font-bold text-[#0a4019]">{blog.author}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(blog)} className="p-2 hover:bg-[#d3d3d3]/20 text-[#0a4019] rounded-xl transition-colors">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => confirmDelete(blog._id)} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )
            }

            {
                isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/20 backdrop-blur-md">
                        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl max-w-md w-full mx-4 border border-[#FDFCFB]">
                            <h3 className="text-2xl font-heading font-bold text-[#0a4019] mb-3">Retract Narrative?</h3>
                            <p className="text-[#6B6B6B] mb-8 font-medium">This article will be permanently removed from the editorial archives. This action is irreversible.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 border border-neutral-200 text-neutral-400 font-bold rounded-2xl hover:bg-neutral-50 transition-colors uppercase tracking-widest text-[10px]">Back to Archives</button>
                                <button onClick={executeDelete} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-shadow uppercase tracking-widest text-[10px]">Permanently Delete</button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                isQuoteModalOpen && (
                    <QuoteModal
                        isOpen={isQuoteModalOpen}
                        onClose={() => setIsQuoteModalOpen(false)}
                        onInsert={handleInsertQuote}
                        initialText={selectedQuoteText}
                    />
                )
            }
            <style jsx global>{`
                .quill-premium-wrapper .ql-toolbar.ql-snow { 
                    border: 1px solid #F5F3F0; 
                    border-bottom: none; 
                    background: white; 
                    border-radius: 1rem 1rem 0 0; 
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                }
                .quill-premium-wrapper .ql-container.ql-snow { 
                    border: 1px solid #F5F3F0; 
                    min-height: 400px; 
                    border-radius: 0 0 1rem 1rem; 
                    background: white; 
                    font-family: inherit; 
                }
                .quill-premium-wrapper .ql-editor {
                    padding: 24px;
                    min-height: 400px;
                    color: #0a4019;
                    line-height: 1.8;
                }
                .quill-premium-wrapper .ql-editor.ql-blank::before {
                    color: #A3A3A3;
                    font-style: italic;
                    left: 24px;
                }
                .quill-premium-wrapper .ql-snow .ql-stroke { stroke: #0a4019; }
                .quill-premium-wrapper .ql-snow .ql-fill { fill: #0a4019; }
                .quill-premium-wrapper .ql-snow .ql-picker { color: #0a4019; font-weight: 600; }
                
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size { width: 100px; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item::before {
                    content: 'Normal' !important;
                }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before { content: 'Tiny (10px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before { content: 'Small (12px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before { content: 'Regular (14px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before { content: 'Normal (16px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before { content: 'Medium (18px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before { content: 'Large (20px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before { content: 'X-Large (24px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="30px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="30px"]::before { content: 'Heading (30px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="36px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="36px"]::before { content: 'Title (36px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="48px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="48px"]::before { content: 'Display (48px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="60px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="60px"]::before { content: 'Mega (60px)' !important; }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="72px"]::before,
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="72px"]::before { content: 'Ultra (72px)' !important; }

                .quill-premium-wrapper .ql-snow .ql-quote-box {
                    width: 28px !important;
                    height: 28px !important;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%230a4019' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z'/%3E%3Cpath d='M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: 18px; 
                    opacity: 0.7;
                    transition: all 0.2s;
                    border-radius: 4px;
                }
                .quill-premium-wrapper .ql-snow .ql-quote-box:hover {
                    opacity: 1;
                    background-color: #F5F3F0;
                }

                .styled-quote-block {
                    margin: 2rem 0;
                    padding: 1.5rem;
                    font-family: serif;
                    font-style: italic;
                }
            `}</style>
        </div >
    );
}

function Star({ size, fill }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={fill || "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-star"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}
