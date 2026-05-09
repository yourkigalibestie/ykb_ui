import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ServiceCardProps {
    title: string;
    description: string;
    icon?: ReactNode;
    imageUrl?: string | null;
    count?: number;
}

export function ServiceCard({ title, description, icon, imageUrl, count }: ServiceCardProps) {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleRequest = () => {
        console.log('Request Service clicked for:', title);
        navigate(`/request?service=${encodeURIComponent(title)}`);
    };

    return (
        <article className="group relative overflow-hidden rounded-lg border border-border bg-white transition-colors duration-200 hover:border-secondary/30 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 via-transparent to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Image Section */}
            <div className="relative h-40 bg-surface/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {imageUrl ? (
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center text-surface">
                        {icon ? (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg text-primary">
                                {icon}
                            </div>
                        ) : (
                            <Sparkles className="h-12 w-12 text-secondary/40" />
                        )}
                    </div>
                )}
                
                {typeof count === 'number' ? (
                    <div className="absolute right-3 top-3 z-20 rounded-full border border-secondary/20 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                        {count}
                    </div>
                ) : null}
            </div>

            {/* Content Section */}
            <div className="relative z-10 flex flex-col flex-grow p-4">
                <h3 className="mb-1 text-base font-semibold text-primary transition-colors duration-200 group-hover:text-secondary">
                    {title}
                </h3>

                <div className="mb-3 flex-grow">
                    <p className={`text-sm leading-relaxed text-textSecondary transition-all duration-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {description}
                    </p>
                    {description.length > 150 && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary/80 transition-colors"
                        >
                            <span>{isExpanded ? 'View less' : 'View more'}</span>
                            <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    )}
                </div>

                <div className="mt-auto">
                    <button
                        onClick={handleRequest}
                        className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-white shadow-gold transition-colors duration-200 hover:bg-[#c49b2f] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                        <span>Request Service</span>
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </article>
    );
}
