import { useEffect, useMemo, useState } from 'react';
import { Loader, Image as ImageIcon, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getBackendAuthHeaders } from '../../utils/backendAuth';
import { uploadServiceImage } from '../../utils/uploadImage';

type StarterGuideCategoryGroup = 'APP' | 'INFRASTRUCTURE' | 'OTHERS';
type Language = 'en' | 'fr';

type Translation = {
  language: Language;
  category: string;
  description: string | null;
  subcategories: string[] | null;
};

type StarterGuideCategory = {
  id: number;
  category: string;
  group?: StarterGuideCategoryGroup | null;
  subcategories: string[] | null;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  isStarterKit?: boolean;
  allowProviderRegistration?: boolean;
  translations?: Translation[];
  createdAt?: string;
  updatedAt?: string;
};

type Row = { value: string };
type LanguageFormState = {
  en: { title: string; description: string; rows: Row[] };
  fr: { title: string; description: string; rows: Row[] };
};

const API_BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:4000/api';

async function readApiErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as any;
    const msg = data?.error?.message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

function rowsToSubcategories(rows: Row[]): string[] {
  return rows.map((row) => row.value.trim()).filter((value) => value.length > 0);
}

function subcategoriesToRows(items: string[] | null | undefined): Row[] {
  const list = Array.isArray(items) ? items : [];
  return list.length > 0 ? list.map((value) => ({ value })) : [{ value: '' }];
}

const GROUP_OPTIONS: Array<{
  value: StarterGuideCategoryGroup;
  title: string;
  description: string;
}> = [
  {
    value: 'INFRASTRUCTURE',
    title: 'Infrastructure',
    description: 'Use when items have a fixed physical location (address is usually required).',
  },
  {
    value: 'APP',
    title: 'Apps',
    description: 'Use when the service is mainly online via mobile/web (link/website is usually required).',
  },
  {
    value: 'OTHERS',
    title: 'Others',
    description: 'Use for anything else (location/link often optional).',
  },
];

function normalizeGroup(value: StarterGuideCategory['group']): StarterGuideCategoryGroup {
  return value === 'APP' || value === 'INFRASTRUCTURE' || value === 'OTHERS' ? value : 'OTHERS';
}

function groupLabel(value: StarterGuideCategoryGroup): string {
  if (value === 'APP') return 'Apps';
  if (value === 'INFRASTRUCTURE') return 'Infrastructure';
  return 'Others';
}


export function AdminStarterandServices() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<StarterGuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createLanguage, setCreateLanguage] = useState<Language>('en');
  const [editLanguage, setEditLanguage] = useState<Language>('en');

  const activeLanguage = useMemo<Language>(() => (i18n.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'), [i18n.language]);

  useEffect(() => {
    setCreateLanguage(activeLanguage);
    setEditLanguage(activeLanguage);
  }, [activeLanguage]);

  const getDisplayFields = (item: StarterGuideCategory) => {
    const translation = item.translations?.find((t) => t.language === activeLanguage);

    const category = translation?.category?.trim() || item.category;
    const description = translation?.description ?? item.description ?? null;
    const subcategories = translation?.subcategories ?? item.subcategories ?? null;

    return { category, description, subcategories };
  };

  // Create form state - with language support
  const [createLang, setCreateLang] = useState<LanguageFormState>({
    en: { title: '', description: '', rows: [{ value: '' }] },
    fr: { title: '', description: '', rows: [{ value: '' }] }
  });
  const [group, setGroup] = useState<StarterGuideCategoryGroup>('OTHERS');
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isStarterKit, setIsStarterKit] = useState(false);
  const [allowProviderRegistration, setAllowProviderRegistration] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Edit form state - with language support
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLang, setEditLang] = useState<LanguageFormState>({
    en: { title: '', description: '', rows: [{ value: '' }] },
    fr: { title: '', description: '', rows: [{ value: '' }] }
  });
  const [editGroup, setEditGroup] = useState<StarterGuideCategoryGroup>('OTHERS');
  const [editHasSubcategories, setEditHasSubcategories] = useState(true);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editImagePublicId, setEditImagePublicId] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editIsStarterKit, setEditIsStarterKit] = useState(true);
  const [editAllowProviderRegistration, setEditAllowProviderRegistration] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const itemsById = useMemo(() => {
    const map = new Map<number, StarterGuideCategory>();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/starter-guide-categories`, {
        headers: { ...getBackendAuthHeaders() },
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      const json = (await res.json()) as StarterGuideCategory[] | { categories?: StarterGuideCategory[] };
      const list = Array.isArray(json) ? json : Array.isArray((json as any).categories) ? (json as any).categories : [];
      if ((import.meta as any).env?.DEV) {
        console.log('[AdminStarterandServices] /starter-guide-categories response', list);
      }
      setItems(list);
      setLoadError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load categories';
      setItems([]);
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (id: number) => {
    const item = itemsById.get(id);
    if (!item) return;
    setEditingId(id);
    setEditLanguage('en');
    setEditGroup(normalizeGroup(item.group));
    setEditHasSubcategories(Array.isArray(item.subcategories) && item.subcategories.length > 0);
    setEditImageUrl(item.imageUrl || '');
    setEditImagePublicId(item.imagePublicId || '');
    setEditIsStarterKit(item.isStarterKit ?? true);
    setEditAllowProviderRegistration(item.allowProviderRegistration ?? false);
    setEditError(null);

    // Load translations
    const enTrans = item.translations?.find(t => t.language === 'en') || { category: item.category, description: item.description || '', subcategories: item.subcategories };
    const frTrans = item.translations?.find(t => t.language === 'fr') || { category: '', description: '', subcategories: null };
    
    setEditLang({
      en: { 
        title: enTrans.category, 
        description: enTrans.description || '',
        rows: subcategoriesToRows(enTrans.subcategories)
      },
      fr: { 
        title: frTrans.category, 
        description: frTrans.description || '',
        rows: subcategoriesToRows(frTrans.subcategories)
      }
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLanguage('en');
    setEditLang({
      en: { title: '', description: '', rows: [{ value: '' }] },
      fr: { title: '', description: '', rows: [{ value: '' }] }
    });
    setEditGroup('OTHERS');
    setEditHasSubcategories(true);
    setEditImageUrl('');
    setEditImagePublicId('');
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditIsStarterKit(true);
    setEditAllowProviderRegistration(false);
    setEditError(null);
  };

  const validate = (lang: LanguageFormState, enabled: boolean): string | null => {
    // Check English (required)
    if (!lang.en.title.trim()) return 'English Service Title is required.';
    // Check French (required)
    if (!lang.fr.title.trim()) return 'French Service Title is required.';
    
    if (!enabled) return null;
    
    // Validate subcategories for both languages
    const enSubcategories = rowsToSubcategories(lang.en.rows);
    const frSubcategories = rowsToSubcategories(lang.fr.rows);
    
    if (enSubcategories.length === 0 || frSubcategories.length === 0) {
      return 'Add at least one category in both languages or turn off categories.';
    }
    return null;
  };

  const createItem = async () => {
    const err = validate(createLang, hasSubcategories);
    if (err) {
      setCreateError(err);
      return;
    }

    if (!imageFile && !imageUrl) {
      setCreateError('Service image is required.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      let finalImageUrl = imageUrl;
      let finalImagePublicId = imagePublicId;

      // Upload image if selected but not yet uploaded
      if (imageFile && !imageUrl) {
        setUploadingImage(true);
        try {
          const result = await uploadServiceImage(imageFile);
          finalImageUrl = result.url;
          finalImagePublicId = result.publicId;
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      }

      const payload: any = {
        category: createLang.en.title.trim(),
        group,
        description: createLang.en.description.trim() || null,
        imageUrl: finalImageUrl.trim() || null,
        imagePublicId: finalImagePublicId.trim() || null,
        isStarterKit,
        allowProviderRegistration,
        translations: [
          {
            language: 'en',
            category: createLang.en.title.trim(),
            description: createLang.en.description.trim() || null,
            subcategories: hasSubcategories ? rowsToSubcategories(createLang.en.rows) : null
          },
          {
            language: 'fr',
            category: createLang.fr.title.trim(),
            description: createLang.fr.description.trim() || null,
            subcategories: hasSubcategories ? rowsToSubcategories(createLang.fr.rows) : null
          }
        ]
      };
      
      if (hasSubcategories) {
        payload.subcategories = rowsToSubcategories(createLang.en.rows);
      }

      const res = await fetch(`${API_BASE}/starter-guide-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      const json = (await res.json()) as { category?: StarterGuideCategory };
      if (!json.category) throw new Error('Invalid response');
      setItems((prev) => [...prev, json.category!].sort((a, b) => a.id - b.id));
      
      // Reset form
      setCreateLang({
        en: { title: '', description: '', rows: [{ value: '' }] },
        fr: { title: '', description: '', rows: [{ value: '' }] }
      });
      setCreateLanguage('en');
      setGroup('OTHERS');
      setHasSubcategories(false);
      setImageUrl('');
      setImagePublicId('');
      setImageFile(null);
      setImagePreview(null);
      setIsStarterKit(true);
      setAllowProviderRegistration(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create service');
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const err = validate(editLang, editHasSubcategories);
    if (err) {
      setEditError(err);
      return;
    }

    setSavingId(editingId);
    setEditError(null);
    try {
      let finalImageUrl = editImageUrl;
      let finalImagePublicId = editImagePublicId;

      // Upload image if selected but not yet uploaded
      if (editImageFile && !editImageUrl) {
        setEditUploadingImage(true);
        try {
          const result = await uploadServiceImage(editImageFile);
          finalImageUrl = result.url;
          finalImagePublicId = result.publicId;
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
        } finally {
          setEditUploadingImage(false);
        }
      }

      const payload: any = {
        category: editLang.en.title.trim(),
        group: editGroup,
        description: editLang.en.description.trim() || null,
        imageUrl: finalImageUrl.trim() || null,
        imagePublicId: finalImagePublicId.trim() || null,
        isStarterKit: editIsStarterKit,
        allowProviderRegistration: editAllowProviderRegistration,
        translations: [
          {
            language: 'en',
            category: editLang.en.title.trim(),
            description: editLang.en.description.trim() || null,
            subcategories: editHasSubcategories ? rowsToSubcategories(editLang.en.rows) : []
          },
          {
            language: 'fr',
            category: editLang.fr.title.trim(),
            description: editLang.fr.description.trim() || null,
            subcategories: editHasSubcategories ? rowsToSubcategories(editLang.fr.rows) : []
          }
        ]
      };
      
      if (editHasSubcategories) {
        payload.subcategories = rowsToSubcategories(editLang.en.rows);
      } else {
        payload.subcategories = [];
      }

      const res = await fetch(`${API_BASE}/starter-guide-categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      const json = (await res.json()) as { category?: StarterGuideCategory };
      if (!json.category) throw new Error('Invalid response');
      setItems((prev) => prev.map((item) => (item.id === editingId ? json.category! : item)));
      cancelEdit();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSavingId(null);
    }
  };

  const deleteItem = async (id: number) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/starter-guide-categories/${id}`, {
        method: 'DELETE',
        headers: { ...getBackendAuthHeaders() },
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to delete service');
    } finally {
      setDeletingId(null);
    }
  };

  const handleImagePreview = (file: File, isEdit: boolean) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (isEdit) {
        setEditImageFile(file);
        setEditImagePreview(preview);
        setEditImageUrl('');
        setEditImagePublicId('');
      } else {
        setImageFile(file);
        setImagePreview(preview);
        setImageUrl('');
        setImagePublicId('');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="pt-16">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Manage services & starter kit</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Services & Starter Kit</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              Create and manage services and starter kit categories with images, descriptions, and provider registration options.
            </p>
          </div>
        </div>
      </section>

      <section className="ykb-section bg-dark-light">
        <div className="ykb-container space-y-5">
          {loadError ? (
            <div className="ykb-card p-6 border border-red-500/30 bg-red-500/10">
              <p className="text-red-200">{loadError}</p>
            </div>
          ) : null}

          <div className="ykb-card">
            <h2 className="text-2xl font-bold text-primary mb-4">Create Service</h2>

            <div className="space-y-4">
                {/* Language Tabs */}
                <div className="flex gap-2 border-b border-border">
                  {(['en', 'fr'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setCreateLanguage(lang)}
                      className={`px-4 py-2 font-semibold transition-colors ${
                        createLanguage === lang
                          ? 'text-secondary border-b-2 border-secondary -mb-1'
                          : 'text-textSecondary hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {lang === 'en' ? 'English' : 'Français'}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Language-specific inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">Service Title * ({createLanguage === 'en' ? 'English' : 'French'})</label>
                    <input
                      className="ykb-field"
                      placeholder={createLanguage === 'en' ? 'e.g., Healthcare Services' : 'ex. Services de santé'}
                      value={createLang[createLanguage].title}
                      onChange={(e) => {
                        setCreateLang(prev => ({
                          ...prev,
                          [createLanguage]: { ...prev[createLanguage], title: e.target.value }
                        }));
                        setCreateError(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">Description ({createLanguage === 'en' ? 'English' : 'French'})</label>
                    <textarea
                      className="ykb-field min-h-[100px]"
                      placeholder={createLanguage === 'en' ? 'Describe this service...' : 'Décrivez ce service...'}
                      value={createLang[createLanguage].description}
                      onChange={(e) => {
                        setCreateLang(prev => ({
                          ...prev,
                          [createLanguage]: { ...prev[createLanguage], description: e.target.value }
                        }));
                        setCreateError(null);
                      }}
                    />
                  </div>

                  {hasSubcategories && (
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-2">
                        Categories ({createLanguage === 'en' ? 'English' : 'French'})
                      </label>
                      <div className="space-y-2">
                        {createLang[createLanguage].rows.map((row, idx) => (
                          <div key={`create-${createLanguage}-${idx}`} className="flex gap-2">
                            <input
                              className="ykb-field flex-1"
                              placeholder={createLanguage === 'en' ? 'e.g., Hospitals' : 'ex. Hôpitaux'}
                              value={row.value}
                              onChange={(e) => {
                                setCreateLang(prev => ({
                                  ...prev,
                                  [createLanguage]: {
                                    ...prev[createLanguage],
                                    rows: prev[createLanguage].rows.map((r, i) => i === idx ? { value: e.target.value } : r)
                                  }
                                }));
                                setCreateError(null);
                              }}
                            />
                            <button
                              type="button"
                              className="ykb-button-outline h-[46px] px-3"
                              onClick={() => {
                                setCreateLang(prev => ({
                                  ...prev,
                                  [createLanguage]: {
                                    ...prev[createLanguage],
                                    rows: prev[createLanguage].rows.filter((_, i) => i !== idx)
                                  }
                                }));
                              }}
                              disabled={createLang[createLanguage].rows.length <= 1}
                            >
                              Remove
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          className="ykb-button-outline px-3 py-2 text-sm"
                          onClick={() => {
                            setCreateLang(prev => ({
                              ...prev,
                              [createLanguage]: {
                                ...prev[createLanguage],
                                rows: [...prev[createLanguage].rows, { value: '' }]
                              }
                            }));
                          }}
                        >
                          Add category
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-2">Group</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {GROUP_OPTIONS.map((opt) => {
                        const selected = group === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={
                              'flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors text-xs ' +
                              (selected
                                ? 'border-secondary/40 bg-secondary/5'
                                : 'border-border bg-white hover:bg-surface/60 hover:border-secondary/30')
                            }
                          >
                            <input
                              type="radio"
                              name="starter-guide-group"
                              value={opt.value}
                              checked={selected}
                              onChange={() => {
                                setGroup(opt.value);
                                setCreateError(null);
                              }}
                              className="mt-1 h-3 w-3 text-secondary focus:ring-secondary"
                            />
                            <div>
                              <div className="font-semibold text-primary">{opt.title}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-3 text-sm text-textSecondary cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={hasSubcategories}
                        onChange={(e) => {
                          setHasSubcategories(e.target.checked);
                          setCreateError(null);
                        }}
                      />
                      Has Categories
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-secondary" />
                    Service Image *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleImagePreview(file, false);
                      }
                      event.target.value = '';
                    }}
                    className="ykb-field"
                  />
                  {uploadingImage ? (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-textSecondary">Uploading image...</span>
                    </div>
                  ) : (imagePreview || imageUrl) ? (
                    <div className="mt-2">
                      <img
                        src={imagePreview || imageUrl}
                        alt="Service preview"
                        className="h-20 w-20 object-cover rounded border border-border"
                      />
                      <p className="mt-1 text-xs text-textSecondary">
                        {imageUrl ? 'Image uploaded successfully' : 'Preview (will upload on save)'}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-sm text-textSecondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStarterKit}
                      onChange={(e) => {
                        setIsStarterKit(e.target.checked);
                        setCreateError(null);
                      }}
                    />
                    Is Starter Kit
                  </label>

                  <label className="flex items-center gap-3 text-sm text-textSecondary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowProviderRegistration}
                      onChange={(e) => {
                        setAllowProviderRegistration(e.target.checked);
                        setCreateError(null);
                      }}
                    />
                    Allow Service Providers to Register
                  </label>
                </div>
            </div>

            {createError ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                {createError}
              </div>
            ) : null}

            <div className="mt-5">
              <button
                type="button"
                onClick={() => void createItem()}
                disabled={creating}
                className="ykb-button-solid disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating…' : 'Create Service'}
              </button>
            </div>
          </div>

          <div className="ykb-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Services</h2>
                <p className="text-textSecondary text-sm">Manage existing services and starter kit categories.</p>
              </div>
              <button type="button" className="ykb-button-outline" onClick={() => void load()} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <p className="text-textSecondary">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-textSecondary">No services yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  const display = getDisplayFields(item);
                  const subcategories = Array.isArray(display.subcategories) ? display.subcategories : [];
                  return (
                    <div key={item.id} className="ykb-card">
                      {!isEditing ? (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-primary">{display.category}</h3>
                              <p className="text-textSecondary text-sm">ID: {item.id}</p>
                              {display.description && (
                                <p className="mt-2 text-sm text-textSecondary">{display.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button type="button" className="ykb-button-outline" onClick={() => startEdit(item.id)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="ykb-button-outline"
                                disabled={deletingId === item.id}
                                onClick={() => void deleteItem(item.id)}
                              >
                                {deletingId === item.id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </div>

                          {item.imageUrl && (
                            <div className="mt-3">
                              <img
                                src={item.imageUrl}
                                alt={item.category}
                                className="h-24 w-full object-cover rounded border border-border"
                              />
                            </div>
                          )}

                          <div className="mt-4 space-y-2">
                            <div className="flex flex-wrap gap-2">
                              <span className="text-xs rounded-full border border-border bg-surface px-3 py-1 text-textSecondary">
                                {groupLabel(normalizeGroup(item.group))}
                              </span>
                              {item.isStarterKit && (
                                <span className="text-xs rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-secondary font-semibold">
                                  Starter Kit
                                </span>
                              )}
                              {item.allowProviderRegistration && (
                                <span className="text-xs rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-secondary font-semibold">
                                  Provider Reg.
                                </span>
                              )}
                            </div>

                            {subcategories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {subcategories.map((sub) => (
                                  <span
                                    key={`${item.id}-${sub}`}
                                    className="text-sm rounded-full border border-border bg-surface px-3 py-1 text-textSecondary"
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-textSecondary">No categories</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-bold text-primary">Edit Service</h3>
                            <button type="button" className="ykb-button-outline" onClick={cancelEdit}>
                              Close
                            </button>
                          </div>

                          <div className="mt-4 space-y-4">
                            {/* Language Tabs */}
                            <div className="flex gap-2 border-b border-border">
                              {(['en', 'fr'] as const).map((lang) => (
                                <button
                                  key={lang}
                                  type="button"
                                  onClick={() => setEditLanguage(lang)}
                                  className={`px-4 py-2 font-semibold transition-colors ${
                                    editLanguage === lang
                                      ? 'text-secondary border-b-2 border-secondary -mb-1'
                                      : 'text-textSecondary hover:text-primary'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    {lang === 'en' ? 'English' : 'Français'}
                                  </div>
                                </button>
                              ))}
                            </div>

                            {/* Language-specific edit inputs */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Service Title * ({editLanguage === 'en' ? 'English' : 'French'})</label>
                                <input
                                  className="ykb-field"
                                  value={editLang[editLanguage].title}
                                  onChange={(e) => {
                                    setEditLang(prev => ({
                                      ...prev,
                                      [editLanguage]: { ...prev[editLanguage], title: e.target.value }
                                    }));
                                    setEditError(null);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Description ({editLanguage === 'en' ? 'English' : 'French'})</label>
                                <textarea
                                  className="ykb-field min-h-[100px]"
                                  value={editLang[editLanguage].description}
                                  onChange={(e) => {
                                    setEditLang(prev => ({
                                      ...prev,
                                      [editLanguage]: { ...prev[editLanguage], description: e.target.value }
                                    }));
                                    setEditError(null);
                                  }}
                                />
                              </div>

                              {editHasSubcategories && (
                                <div>
                                  <label className="block text-sm font-semibold text-primary mb-2">
                                    Categories ({editLanguage === 'en' ? 'English' : 'French'})
                                  </label>
                                  <div className="space-y-2">
                                    {editLang[editLanguage].rows.map((row, idx) => (
                                      <div key={`edit-${editLanguage}-${idx}`} className="flex gap-2">
                                        <input
                                          className="ykb-field flex-1"
                                          placeholder={editLanguage === 'en' ? 'e.g., Hospitals' : 'ex. Hôpitaux'}
                                          value={row.value}
                                          onChange={(e) => {
                                            setEditLang(prev => ({
                                              ...prev,
                                              [editLanguage]: {
                                                ...prev[editLanguage],
                                                rows: prev[editLanguage].rows.map((r, i) => i === idx ? { value: e.target.value } : r)
                                              }
                                            }));
                                            setEditError(null);
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="ykb-button-outline h-[46px] px-3"
                                          onClick={() => {
                                            setEditLang(prev => ({
                                              ...prev,
                                              [editLanguage]: {
                                                ...prev[editLanguage],
                                                rows: prev[editLanguage].rows.filter((_, i) => i !== idx)
                                              }
                                            }));
                                          }}
                                          disabled={editLang[editLanguage].rows.length <= 1}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    ))}

                                    <button
                                      type="button"
                                      className="ykb-button-outline px-3 py-2 text-sm"
                                      onClick={() => {
                                        setEditLang(prev => ({
                                          ...prev,
                                          [editLanguage]: {
                                            ...prev[editLanguage],
                                            rows: [...prev[editLanguage].rows, { value: '' }]
                                          }
                                        }));
                                      }}
                                    >
                                      Add category
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Group</label>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                  {GROUP_OPTIONS.map((opt) => {
                                    const selected = editGroup === opt.value;
                                    return (
                                      <label
                                        key={opt.value}
                                        className={
                                          'flex cursor-pointer items-start gap-2 rounded-lg border p-2 transition-colors text-xs ' +
                                          (selected
                                            ? 'border-secondary/40 bg-secondary/5'
                                            : 'border-border bg-white hover:bg-surface/60 hover:border-secondary/30')
                                        }
                                      >
                                        <input
                                          type="radio"
                                          name="starter-guide-group-edit"
                                          value={opt.value}
                                          checked={selected}
                                          onChange={() => {
                                            setEditGroup(opt.value);
                                            setEditError(null);
                                          }}
                                          className="mt-1 h-3 w-3 text-secondary focus:ring-secondary"
                                        />
                                        <div>
                                          <div className="font-semibold text-primary">{opt.title}</div>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label className="flex items-center gap-3 text-sm text-textSecondary cursor-pointer mb-2">
                                  <input
                                    type="checkbox"
                                    checked={editHasSubcategories}
                                    onChange={(e) => {
                                      setEditHasSubcategories(e.target.checked);
                                      setEditError(null);
                                    }}
                                  />
                                  Has Categories
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-secondary" />
                                Service Image *
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={editUploadingImage}
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    handleImagePreview(file, true);
                                  }
                                  event.target.value = '';
                                }}
                                className="ykb-field"
                              />
                              {editUploadingImage ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <Loader className="h-4 w-4 animate-spin text-primary" />
                                  <span className="text-sm text-textSecondary">Uploading image...</span>
                                </div>
                              ) : (editImagePreview || editImageUrl) ? (
                                <div className="mt-2">
                                  <img
                                    src={editImagePreview || editImageUrl}
                                    alt="Service preview"
                                    className="h-20 w-20 object-cover rounded border border-border"
                                  />
                                  <p className="mt-1 text-xs text-textSecondary">
                                    {editImageUrl ? 'Image uploaded successfully' : 'Preview (will upload on save)'}
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            <div className="space-y-2">
                              <label className="flex items-center gap-3 text-sm text-textSecondary cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsStarterKit}
                                  onChange={(e) => {
                                    setEditIsStarterKit(e.target.checked);
                                    setEditError(null);
                                  }}
                                />
                                Is Starter Kit
                              </label>

                              <label className="flex items-center gap-3 text-sm text-textSecondary cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editAllowProviderRegistration}
                                  onChange={(e) => {
                                    setEditAllowProviderRegistration(e.target.checked);
                                    setEditError(null);
                                  }}
                                />
                                Allow Service Providers to Register
                              </label>
                            </div>
                          </div>

                          {editError ? (
                            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                              {editError}
                            </div>
                          ) : null}

                          <div className="mt-5 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => void saveEdit()}
                              disabled={savingId === item.id}
                              className="flex-1 ykb-button-solid disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {savingId === item.id ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button type="button" className="ykb-button-outline" onClick={cancelEdit}>
                              Cancel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
