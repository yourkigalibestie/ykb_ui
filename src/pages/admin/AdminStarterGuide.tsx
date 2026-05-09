import { useEffect, useMemo, useState } from 'react';
import { getBackendAuthHeaders } from '../../utils/backendAuth';

type StarterGuideCategoryGroup = 'APP' | 'INFRASTRUCTURE' | 'OTHERS';

type StarterGuideCategory = {
  id: number;
  category: string;
  group?: StarterGuideCategoryGroup | null;
  subcategories: string[] | null;
  createdAt?: string;
  updatedAt?: string;
};

type Row = { value: string };

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

function GroupPicker(props: {
  value: StarterGuideCategoryGroup;
  onChange: (next: StarterGuideCategoryGroup) => void;
}) {
  const { value, onChange } = props;
  return (
    <div>
      <label className="block text-sm font-semibold text-primary mb-2">Group</label>
      <div className="space-y-3">
        {GROUP_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ' +
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
                onChange={() => onChange(opt.value)}
                className="mt-1 h-4 w-4 text-secondary focus:ring-secondary"
              />
              <div>
                <div className="text-sm font-bold text-primary">{opt.title}</div>
                <div className="mt-1 text-xs text-textSecondary">{opt.description}</div>
              </div>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-textSecondary">
        This grouping helps the app decide what information to require later (for example: location required for Infrastructure, link/website required for Apps).
      </p>
    </div>
  );
}

export function AdminStarterGuide() {
  const [items, setItems] = useState<StarterGuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [category, setCategory] = useState('');
  const [group, setGroup] = useState<StarterGuideCategoryGroup>('OTHERS');
  const [hasSubcategories, setHasSubcategories] = useState(false);
  const [createRows, setCreateRows] = useState<Row[]>([{ value: '' }]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editGroup, setEditGroup] = useState<StarterGuideCategoryGroup>('OTHERS');
  const [editHasSubcategories, setEditHasSubcategories] = useState(true);
  const [editRows, setEditRows] = useState<Row[]>([]);
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
      const json = (await res.json()) as { categories?: StarterGuideCategory[] };
      const list = Array.isArray(json.categories) ? json.categories : [];
      setItems(list);
      setLoadError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load starter guide categories';
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
    setEditCategory(item.category);
    setEditGroup(normalizeGroup(item.group));
    const subcats = Array.isArray(item.subcategories) ? item.subcategories : [];
    setEditHasSubcategories(subcats.length > 0);
    setEditRows(subcategoriesToRows(item.subcategories));
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCategory('');
    setEditGroup('OTHERS');
    setEditHasSubcategories(true);
    setEditRows([]);
    setEditError(null);
  };

  const validate = (value: string, rows: Row[], enabled: boolean): string | null => {
    if (!value.trim()) return 'Category is required.';
    if (!enabled) return null;
    const subcategories = rowsToSubcategories(rows);
    if (subcategories.length === 0) return 'Add at least one subcategory or turn off subcategories.';
    return null;
  };

  const createItem = async () => {
    const err = validate(category, createRows, hasSubcategories);
    if (err) {
      setCreateError(err);
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const payload: any = { category: category.trim(), group };
      if (hasSubcategories) payload.subcategories = rowsToSubcategories(createRows);

      const res = await fetch(`${API_BASE}/starter-guide-categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getBackendAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readApiErrorMessage(res));
      const json = (await res.json()) as { category?: StarterGuideCategory };
      if (!json.category) throw new Error('Invalid response');
      setItems((prev) => [...prev, json.category!].sort((a, b) => a.id - b.id));
      setCategory('');
      setGroup('OTHERS');
      setHasSubcategories(true);
      setCreateRows([{ value: '' }]);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create category');
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const err = validate(editCategory, editRows, editHasSubcategories);
    if (err) {
      setEditError(err);
      return;
    }

    setSavingId(editingId);
    setEditError(null);
    try {
      const payload: any = { category: editCategory.trim(), group: editGroup };
      if (editHasSubcategories) payload.subcategories = rowsToSubcategories(editRows);
      else payload.subcategories = [];

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
      setLoadError(e instanceof Error ? e.message : 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="pt-16">
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Manage starter guide content</p>
            <h1 className="text-3xl font-semibold text-primary md:text-4xl">Starter Guide Categories</h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-textSecondary">
              Define categories with optional subcategories like clinics, hospitals, pharmacies, or leave them as single categories like transport apps.
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
            <h2 className="text-2xl font-bold text-primary mb-4">Add category</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <label className="block text-sm font-semibold text-primary mb-2">Category</label>
                <input
                  className="ykb-field"
                  placeholder="e.g., Emergency & Healthcare"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCreateError(null);
                  }}
                />

                <div className="mt-4">
                  <GroupPicker
                    value={group}
                    onChange={(next) => {
                      setGroup(next);
                      setCreateError(null);
                    }}
                  />
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm text-textSecondary">
                  <input
                    type="checkbox"
                    checked={hasSubcategories}
                    onChange={(e) => {
                      setHasSubcategories(e.target.checked);
                      setCreateError(null);
                    }}
                  />
                  Has subcategories
                </label>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold text-primary mb-2">
                  {hasSubcategories ? 'Subcategories' : 'Subcategories (disabled)'}
                </label>
                {hasSubcategories ? (
                  <div className="space-y-3">
                    {createRows.map((row, idx) => (
                      <div key={`create-${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          className="ykb-field sm:col-span-2"
                          placeholder="e.g., Hospitals"
                          value={row.value}
                          onChange={(e) => {
                            const next = [...createRows];
                            next[idx] = { value: e.target.value };
                            setCreateRows(next);
                            setCreateError(null);
                          }}
                        />
                        <button
                          type="button"
                          className="ykb-button-outline h-[46px]"
                          onClick={() => setCreateRows((prev) => prev.filter((_, i) => i !== idx))}
                          disabled={createRows.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="ykb-button-outline px-4 py-2"
                      onClick={() => setCreateRows((prev) => [...prev, { value: '' }])}
                    >
                      Add subcategory
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No subcategories will be saved for this category.</p>
                )}
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
                {creating ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>

          <div className="ykb-card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Categories</h2>
                <p className="text-textSecondary text-sm">Use the data below in the starter guide page.</p>
              </div>
              <button type="button" className="ykb-button-outline" onClick={() => void load()} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {loading ? (
              <p className="text-textSecondary">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-textSecondary">No categories yet.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  const subcategories = Array.isArray(item.subcategories) ? item.subcategories : [];
                  return (
                    <div key={item.id} className="ykb-card">
                      {!isEditing ? (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-bold text-primary">{item.category}</h3>
                              <p className="text-textSecondary text-sm">ID: {item.id}</p>
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

                          <div className="mt-4">
                            <div className="mb-3">
                              <span className="text-xs rounded-full border border-border bg-surface px-3 py-1 text-textSecondary">
                                {groupLabel(normalizeGroup(item.group))}
                              </span>
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
                              <span className="text-sm text-textSecondary">No subcategories</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-bold text-primary">Edit category</h3>
                            <button type="button" className="ykb-button-outline" onClick={cancelEdit}>
                              Close
                            </button>
                          </div>

                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-primary mb-2">Category</label>
                              <input
                                className="ykb-field"
                                value={editCategory}
                                onChange={(e) => {
                                  setEditCategory(e.target.value);
                                  setEditError(null);
                                }}
                              />
                            </div>

                            <GroupPicker
                              value={editGroup}
                              onChange={(next) => {
                                setEditGroup(next);
                                setEditError(null);
                              }}
                            />

                            <label className="flex items-center gap-3 text-sm text-textSecondary">
                              <input
                                type="checkbox"
                                checked={editHasSubcategories}
                                onChange={(e) => {
                                  setEditHasSubcategories(e.target.checked);
                                  setEditError(null);
                                }}
                              />
                              Has subcategories
                            </label>

                            {editHasSubcategories ? (
                              <div>
                                <label className="block text-sm font-semibold text-primary mb-2">Subcategories</label>
                                <div className="space-y-3">
                                  {editRows.map((row, idx) => (
                                    <div key={`edit-${idx}`} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <input
                                        className="ykb-field sm:col-span-2"
                                        placeholder="e.g., Clinics"
                                        value={row.value}
                                        onChange={(e) => {
                                          const next = [...editRows];
                                          next[idx] = { value: e.target.value };
                                          setEditRows(next);
                                          setEditError(null);
                                        }}
                                      />
                                      <button
                                        type="button"
                                        className="ykb-button-outline h-[46px]"
                                        onClick={() => setEditRows((prev) => prev.filter((_, i) => i !== idx))}
                                        disabled={editRows.length <= 1}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    className="ykb-button-outline px-4 py-2"
                                    onClick={() => setEditRows((prev) => [...prev, { value: '' }])}
                                  >
                                    Add subcategory
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm">Subcategories will be saved as empty for this category.</p>
                            )}

                            {editError ? (
                              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                                {editError}
                              </div>
                            ) : null}

                            <button
                              type="button"
                              className="ykb-button-solid px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                              onClick={() => void saveEdit()}
                              disabled={savingId === item.id}
                            >
                              {savingId === item.id ? 'Saving…' : 'Save'}
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
