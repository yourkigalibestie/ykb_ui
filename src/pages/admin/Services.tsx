import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Home, Globe, ShoppingBag, Coffee, Car, Heart, Pencil, Upload, Loader } from 'lucide-react';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { uploadServiceImage } from '../../utils/uploadImage';

interface ServiceCardProps {
    title: string;
    description: string;
    icon?: ReactNode;
    imageUrl?: string | null;
    count?: number;
    variant?: 'default' | 'compact' | 'featured' | 'touch';
    onRequest?: (serviceName: string) => void;
    onSelect?: (serviceName: string) => void;
    onEdit?: () => void;
    className?: string;
    ctaText?: string;
    disabled?: boolean;
}

function ServiceCard({
    title,
    description,
    icon,
    imageUrl,
    count,
    variant = 'default',
    onRequest,
    onSelect,
    onEdit,
    className = '',
    ctaText = 'Request Service',
    disabled = false,
}: ServiceCardProps) {
    const navigate = useNavigate();

    const handleRequest = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        if (disabled) return;

        if (onRequest) {
            onRequest(title);
        } else {
            navigate(`/request?service=${encodeURIComponent(title)}`);
        }
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'compact':
                return 'p-4';
            case 'featured':
                return 'p-5 border-secondary/30 bg-gradient-to-br from-white via-surface to-white';
            case 'touch':
                return 'p-5 rounded-none border-0 shadow-none hover:bg-surface/60';
            default:
                return 'p-5';
        }
    };

    const getIconStyles = () => {
        const baseStyles = 'flex items-center justify-center transition-all duration-300';
        const sizeStyles = variant === 'compact' ? 'h-10 w-10 rounded-lg' : 'h-12 w-12 rounded-xl';

        if (icon) {
            return `${baseStyles} ${sizeStyles} border border-border bg-surface text-primary group-hover:border-secondary/30 group-hover:text-secondary`;
        }

        return `${baseStyles} ${sizeStyles} border border-border bg-surface text-secondary group-hover:border-secondary/30 group-hover:text-secondary`;
    };

    return (
        <article
            className={`group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-white transition-colors duration-200 hover:border-secondary/30 ${getVariantStyles()} ${className}`}
            role="article"
            aria-disabled={disabled}
            onClick={() => {
                if (disabled) return;
                onSelect?.(title);
            }}
        >
            {variant !== 'touch' ? (
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 via-transparent to-primary/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            ) : null}

            {typeof count === 'number' ? (
                <div className="absolute right-4 top-4 z-20 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {count}
                </div>
            ) : null}

            {onEdit ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        if (disabled) return;
                        onEdit();
                    }}
                    className="absolute right-4 top-4 z-30 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-textSecondary transition-colors hover:bg-surface/60 hover:text-primary"
                    aria-label={`Edit ${title}`}
                >
                    <Pencil className="h-4 w-4" />
                </button>
            ) : null}

            <div className={`relative z-10 flex h-full flex-col ${typeof count === 'number' ? 'pt-4' : ''}`}>
                <div className="mb-4">
                    <div className={getIconStyles()}>
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={title} 
                                className="w-full h-full object-cover"
                            />
                        ) : icon ? (
                            icon
                        ) : null}
                    </div>
                </div>

                <h3 className="mb-2 text-xl font-semibold text-primary transition-colors duration-300 group-hover:text-secondary">
                    {title}
                </h3>

                <p className="mb-5 flex-grow text-sm leading-relaxed text-textSecondary">{description}</p>

                <button
                    onClick={handleRequest}
                    disabled={disabled}
                    className={`inline-flex items-center gap-2 self-start rounded-md px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                        disabled
                            ? 'cursor-not-allowed border border-border bg-surface text-textSecondary opacity-70'
                            : 'bg-secondary text-white shadow-gold hover:bg-secondary/90'
                    }`}
                    aria-label={`Request ${title} service`}
                >
                    <span>{ctaText}</span>
                    <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${!disabled ? 'group-hover:translate-x-1' : ''}`} />
                </button>
            </div>
        </article>
    );
}

type PublicService = {
    id: number;
    title: string;
    description: string;
    imageUrl?: string | null;
    imagePublicId?: string | null;
};

type ServiceSlot = {
    service: PublicService | null;
    draft: { title: string; description: string; imageUrl: string; imagePublicId: string };
    saving: boolean;
    uploading: boolean;
    error: string | null;
};

type ApiErrorResponse = {
    error?: {
        message?: unknown;
    };
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function readApiErrorMessage(response: Response): Promise<string> {
    try {
        const data = (await response.json()) as ApiErrorResponse;
        const message = data?.error?.message;
        if (typeof message === 'string' && message.trim().length > 0) return message;
    } catch {
        // ignore
    }

    return `Request failed (${response.status})`;
}

function buildSlots(services: PublicService[]): ServiceSlot[] {
    const slots: ServiceSlot[] = [];

    for (let index = 0; index < 11; index += 1) {
        const service = services[index] ?? null;

        slots.push({
            service,
            draft: {
                title: service?.title ?? '',
                description: service?.description ?? '',
                imageUrl: service?.imageUrl ?? '',
                imagePublicId: service?.imagePublicId ?? '',
            },
            saving: false,
            uploading: false,
            error: null,
        });
    }

    return slots;
}

const getServiceIcon = (title: string): ReactNode => {
    const iconMap: Record<string, ReactNode> = {
        'Personal Assistance': <Heart className="h-5 w-5" />,
        'Errand Running': <ShoppingBag className="h-5 w-5" />,
        'Event Planning': <Calendar className="h-5 w-5" />,
        'Housing Assistance': <Home className="h-5 w-5" />,
        'Translation Services': <Globe className="h-5 w-5" />,
        Transportation: <Car className="h-5 w-5" />,
        Concierge: <Coffee className="h-5 w-5" />,
    };

    return iconMap[title] || null;
};

export function AdminServices() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
    const [slots, setSlots] = useState<ServiceSlot[]>(() => buildSlots([]));
    const [loadError, setLoadError] = useState<string | null>(null);
    const [activeEditIndex, setActiveEditIndex] = useState<number | null>(null);

    const activeSlot: ServiceSlot | null =
        typeof activeEditIndex === 'number' && activeEditIndex >= 0 && activeEditIndex < slots.length
            ? slots[activeEditIndex]
            : null;

    const goToProviders = (serviceName: string) => {
        navigate(`/admin/providers?service=${encodeURIComponent(serviceName)}`);
    };

    const filledCount = slots.reduce((accumulator, slot) => (slot.service ? accumulator + 1 : accumulator), 0);
    const isSetupMode = filledCount < 11;

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            try {
                const response = await fetch(`${API_BASE}/services`);
                if (!response.ok) throw new Error('Failed to load services');

                const json = (await response.json()) as { services?: PublicService[] };
                const list = Array.isArray(json.services) ? json.services : [];

                if (!mounted) return;
                setSlots(buildSlots(list));
                setLoadError(null);
            } catch {
                if (!mounted) return;
                setLoadError('Backend not reachable — you can still fill the fields, but saving will fail until the API is running.');
                setSlots(buildSlots([]));
            }
        };

        run();
        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible((prev) => ({ ...prev, [entry.target.id]: entry.isIntersecting }));
                });
            },
            { threshold: 0.1 }
        );

        document.querySelectorAll('.animate-on-scroll').forEach((element) => {
            observer.observe(element);
        });

        return () => observer.disconnect();
    }, [slots.length]);

    const saveSlot = async (index: number) => {
        const slot = slots[index];
        if (!slot) return;

        const title = slot.draft.title?.trim() || '';
        const description = slot.draft.description?.trim() || '';
        const imageUrl = slot.draft.imageUrl?.trim() || '';

        if (!title || !description || !imageUrl) {
            setSlots((prev) =>
                prev.map((currentSlot, slotIndex) =>
                    slotIndex === index
                        ? {
                              ...currentSlot,
                              saving: false,
                              error: !title ? 'Service title is required.' : 
                                     !description ? 'Description is required.' : 
                                     'Service image is required.',
                          }
                        : currentSlot
                )
            );
            return;
        }

        setSlots((prev) =>
            prev.map((currentSlot, slotIndex) =>
                slotIndex === index ? { ...currentSlot, saving: true, error: null } : currentSlot
            )
        );

        try {
            if (!slot.service) {
                console.log('Creating new service with:', { title, description, imageUrl: slot.draft.imageUrl, imagePublicId: slot.draft.imagePublicId });
                const response = await fetch(`${API_BASE}/services`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title, 
                        description, 
                        imageUrl: slot.draft.imageUrl,
                        imagePublicId: slot.draft.imagePublicId 
                    }),
                });

                if (!response.ok) {
                    const message = await readApiErrorMessage(response);
                    throw new Error(message);
                }

                const json = (await response.json()) as { service?: PublicService };
                if (!json.service) throw new Error('Invalid response');

                setSlots((prev) =>
                    prev.map((currentSlot, slotIndex) =>
                        slotIndex === index
                            ? {
                                  ...currentSlot,
                                  service: json.service!,
                                  draft: { 
                                      title: json.service!.title, 
                                      description: json.service!.description,
                                      imageUrl: json.service!.imageUrl ?? '',
                                      imagePublicId: json.service!.imagePublicId ?? ''
                                  },
                                  saving: false,
                                  error: null,
                              }
                            : currentSlot
                    )
                );
            } else {
                console.log('Updating service with:', { title, description, imageUrl: slot.draft.imageUrl, imagePublicId: slot.draft.imagePublicId });
                const response = await fetch(`${API_BASE}/services/${slot.service.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title, 
                        description, 
                        imageUrl: slot.draft.imageUrl,
                        imagePublicId: slot.draft.imagePublicId 
                    }),
                });

                if (!response.ok) {
                    const message = await readApiErrorMessage(response);
                    throw new Error(message);
                }

                const json = (await response.json()) as { service?: PublicService };
                if (!json.service) throw new Error('Invalid response');

                setSlots((prev) =>
                    prev.map((currentSlot, slotIndex) =>
                        slotIndex === index
                            ? {
                                  ...currentSlot,
                                  service: json.service!,
                                  draft: { 
                                      title: json.service!.title, 
                                      description: json.service!.description,
                                      imageUrl: json.service!.imageUrl ?? '',
                                      imagePublicId: json.service!.imagePublicId ?? ''
                                  },
                                  saving: false,
                                  error: null,
                              }
                            : currentSlot
                    )
                );
            }

            setActiveEditIndex(null);
        } catch (error) {
            const message = error instanceof Error && error.message ? error.message : 'Could not save. Make sure the backend is running.';

            setSlots((prev) =>
                prev.map((currentSlot, slotIndex) =>
                    slotIndex === index ? { ...currentSlot, saving: false, error: message } : currentSlot
                )
            );
        }
    };

    return (
        <main className="min-h-screen bg-white pt-16 text-gray-900">
            <section className="border-b border-border bg-white py-8">
                <div className="ykb-container">
                    <div className="max-w-2xl">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Manage services</p>
                        <h1 className="text-3xl font-semibold text-primary md:text-4xl">Services</h1>
                        <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
                            Comprehensive concierge solutions tailored to your needs in Kigali.
                        </p>
                    </div>
                </div>
            </section>

            <section className="ykb-section bg-surface/50">
                <div className="ykb-container">
                    {loadError ? <div className="mb-5 ykb-alert ykb-alert-warning">{loadError}</div> : null}

                    {activeSlot && typeof activeEditIndex === 'number' ? (
                        <div
                            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
                            role="dialog"
                            aria-modal="true"
                            onClick={() => setActiveEditIndex(null)}
                        >
                            <div className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
                                <div className="ykb-card">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-textSecondary">Edit service</div>
                                            <h2 className="mt-2 text-xl font-semibold text-primary">
                                                {activeSlot.service?.title || `Service ${activeEditIndex + 1}`}
                                            </h2>
                                            <p className="mt-1 text-sm text-textSecondary">Update the title and description, then save.</p>
                                        </div>

                                        <button type="button" className="ykb-button-outline" onClick={() => setActiveEditIndex(null)}>
                                            Close
                                        </button>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="admin-service-title">
                                                Service title
                                            </label>
                                            <input
                                                id="admin-service-title"
                                                value={activeSlot.draft.title}
                                                onChange={(event) =>
                                                    setSlots((prev) =>
                                                        prev.map((currentSlot, slotIndex) =>
                                                            slotIndex === activeEditIndex
                                                                ? {
                                                                      ...currentSlot,
                                                                      draft: { ...currentSlot.draft, title: event.target.value },
                                                                      error: null,
                                                                  }
                                                                : currentSlot
                                                        )
                                                    )
                                                }
                                                className="ykb-field"
                                                placeholder="e.g., Personal Assistance"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="admin-service-desc">
                                                Description
                                            </label>
                                            <textarea
                                                id="admin-service-desc"
                                                value={activeSlot.draft.description}
                                                onChange={(event) =>
                                                    setSlots((prev) =>
                                                        prev.map((currentSlot, slotIndex) =>
                                                            slotIndex === activeEditIndex
                                                                ? {
                                                                      ...currentSlot,
                                                                      draft: { ...currentSlot.draft, description: event.target.value },
                                                                      error: null,
                                                                  }
                                                                : currentSlot
                                                        )
                                                    )
                                                }
                                                className="ykb-field min-h-[120px]"
                                                placeholder="Describe the service…"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1.5 block text-sm font-semibold text-primary" htmlFor="admin-service-image">
                                                Service Image *
                                            </label>
                                            <input
                                                id="admin-service-image"
                                                type="file"
                                                accept="image/*"
                                                disabled={activeSlot.uploading}
                                                onChange={async (event) => {
                                                    const file = event.target.files?.[0];
                                                    if (!file) return;

                                                    setSlots((prev) =>
                                                        prev.map((currentSlot, slotIndex) =>
                                                            slotIndex === activeEditIndex
                                                                ? { ...currentSlot, uploading: true, error: null }
                                                                : currentSlot
                                                        )
                                                    );

                                                    try {
                                                        const result = await uploadServiceImage(file);
                                                        console.log('Upload succeeded, updating state:', result);

                                                        setSlots((prev) =>
                                                            prev.map((currentSlot, slotIndex) =>
                                                                slotIndex === activeEditIndex
                                                                    ? {
                                                                          ...currentSlot,
                                                                          draft: {
                                                                              ...currentSlot.draft,
                                                                              imageUrl: result.url,
                                                                              imagePublicId: result.publicId,
                                                                          },
                                                                          uploading: false,
                                                                          error: null,
                                                                      }
                                                                    : currentSlot
                                                            )
                                                        );
                                                    } catch (error) {
                                                        const message = error instanceof Error ? error.message : 'Failed to upload image';
                                                        console.error('Upload error:', message);
                                                        setSlots((prev) =>
                                                            prev.map((currentSlot, slotIndex) =>
                                                                slotIndex === activeEditIndex
                                                                    ? {
                                                                          ...currentSlot,
                                                                          uploading: false,
                                                                          error: message,
                                                                      }
                                                                    : currentSlot
                                                            )
                                                        );
                                                    }
                                                    event.target.value = '';
                                                }}
                                                className="ykb-field"
                                            />
                                            {activeSlot.uploading ? (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <Loader className="h-4 w-4 animate-spin text-primary" />
                                                    <span className="text-sm text-textSecondary">Uploading image...</span>
                                                </div>
                                            ) : activeSlot.draft.imageUrl ? (
                                                <div className="mt-2">
                                                    <img
                                                        src={activeSlot.draft.imageUrl}
                                                        alt="Service preview"
                                                        className="h-20 w-20 object-cover rounded border border-border"
                                                    />
                                                    <p className="mt-1 text-xs text-textSecondary">Image uploaded successfully</p>
                                                </div>
                                            ) : null}
                                        </div>

                                        {activeSlot.error ? <div className="ykb-alert ykb-alert-error">{activeSlot.error}</div> : null}

                                        <button
                                            type="button"
                                            onClick={() => saveSlot(activeEditIndex)}
                                            disabled={activeSlot.saving}
                                            className="w-full ykb-button-solid disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {activeSlot.saving ? 'Saving…' : 'Save Service'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {isSetupMode ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {slots.map((slot, index) => {
                                const displayTitle = slot.service?.title || `Service ${index + 1}`;
                                const displayDescription = slot.service?.description || 'Click to add a title and description.';

                                return (
                                    <div
                                        key={`slot-${index}`}
                                        className={`animate-on-scroll ${isVisible[`service-${index}`] ? 'visible' : ''}`}
                                        id={`service-${index}`}
                                        style={{ transitionDelay: `${index * 80}ms` }}
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            className="cursor-pointer"
                                            onClick={() => setActiveEditIndex(index)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    setActiveEditIndex(index);
                                                }
                                            }}
                                        >
                                            <div className="rounded-lg border border-border bg-white transition-colors duration-200 hover:border-secondary/30 hover:bg-surface/60 overflow-hidden">
                                                {/* Image section */}
                                                <div className="relative h-40 bg-surface/50 flex items-center justify-center overflow-hidden">
                                                    {slot.draft.imageUrl ? (
                                                        <img 
                                                            src={slot.draft.imageUrl} 
                                                            alt={slot.service?.title || 'Service'} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center gap-2 text-textSecondary">
                                                            <Upload className="h-8 w-8" />
                                                            <span className="text-xs">Add image</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute top-2 right-2 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-semibold text-primary">
                                                        {index + 1}
                                                    </div>
                                                </div>

                                                {/* Content section */}
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm font-semibold text-primary truncate">{displayTitle}</h3>
                                                            <p className="line-clamp-2 text-xs text-textSecondary mt-1">{displayDescription}</p>
                                                        </div>
                                                        <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-textSecondary">
                                                            {slot.service ? 'Saved' : 'Empty'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                if (!slot.service) return;
                                                                goToProviders(slot.service.title);
                                                            }}
                                                            disabled={!slot.service}
                                                            className="flex-1 ykb-button-primary text-xs disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            Providers
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                setActiveEditIndex(index);
                                                            }}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-textSecondary transition-colors hover:bg-surface/60 hover:text-primary"
                                                            aria-label={`Edit ${displayTitle}`}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-border bg-border">
                            <div className="grid grid-cols-1 gap-px md:grid-cols-2 lg:grid-cols-3">
                                {slots.map((slot, index) => {
                                    const count = index + 1;
                                    if (!slot.service) return null;

                                    return (
                                        <div
                                            key={`slot-${index}`}
                                            className={`animate-on-scroll bg-white ${isVisible[`service-${index}`] ? 'visible' : ''}`}
                                            id={`service-${index}`}
                                            style={{ transitionDelay: `${index * 80}ms` }}
                                        >
                                            <ServiceCard
                                                title={slot.service.title}
                                                description={slot.service.description}
                                                icon={getServiceIcon(slot.service.title)}
                                                imageUrl={slot.service.imageUrl}
                                                count={count}
                                                variant="touch"
                                                className="h-full"
                                                ctaText="Go to Providers"
                                                onEdit={() => setActiveEditIndex(index)}
                                                onSelect={(serviceName) => {
                                                    goToProviders(serviceName);
                                                }}
                                                onRequest={(serviceName) => {
                                                    goToProviders(serviceName);
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>


        </main>
    );
}
