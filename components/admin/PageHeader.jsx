export default function PageHeader({ title, description, actions }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a2e]">{title}</h1>
                {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}
