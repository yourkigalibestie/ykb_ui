import { useEffect, useState } from 'react';
import { Trash2, Edit2, Plus, AlertCircle, Check } from 'lucide-react';
import { API_BASE, getBackendAuthHeaders } from '../../utils/backendAuth';

interface Plan {
  id: string;
  title: string;
  features: string[];
  feeRwf: number;
  feeUsd: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  features: string[];
  feeRwf: string;
  feeUsd: string;
}

const initialFormData: FormData = {
  title: '',
  features: [''],
  feeRwf: '',
  feeUsd: '',
};

export function AdminPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/plans`, {
        headers: {
          ...getBackendAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }

      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, ''],
    });
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Plan title is required');
      return;
    }

    const validFeatures = formData.features.filter(f => f.trim());
    if (validFeatures.length === 0) {
      setError('At least one feature is required');
      return;
    }

    if (!formData.feeRwf || parseFloat(formData.feeRwf) <= 0) {
      setError('Valid RWF fee is required');
      return;
    }

    if (!formData.feeUsd || parseFloat(formData.feeUsd) <= 0) {
      setError('Valid USD fee is required');
      return;
    }

    try {
      setSubmitting(true);

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `${API_BASE}/plans/${editingId}`
        : `${API_BASE}/plans`;

      const response = await fetch(url, {
        method,
        headers: {
          ...getBackendAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          features: validFeatures,
          feeRwf: formData.feeRwf,
          feeUsd: formData.feeUsd,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save plan');
      }

      setSuccess(editingId ? 'Plan updated successfully' : 'Plan created successfully');
      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setFormData({
      title: plan.title,
      features: plan.features,
      feeRwf: plan.feeRwf.toString(),
      feeUsd: plan.feeUsd.toString(),
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`${API_BASE}/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          ...getBackendAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      setSuccess('Plan deleted successfully');
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  return (
    <main className="pt-24 bg-white text-gray-900">
      {/* Header */}
      <section className="border-b border-border bg-white py-8">
        <div className="ykb-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">
                Admin Panel
              </p>
              <h1 className="text-3xl font-semibold text-primary md:text-4xl">
                Manage Plans
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="ykb-section bg-dark-light">
        <div className="ykb-container">
          {/* Messages */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form Toggle Button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-8 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Plan
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="ykb-card mb-8">
              <h2 className="text-2xl font-bold text-primary mb-6">
                {editingId ? 'Edit Plan' : 'Create New Plan'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Plan Title */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Plan Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="ykb-field"
                    placeholder="e.g., Starter, Professional, Enterprise"
                  />
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-semibold text-primary mb-1.5">
                    Features <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) =>
                            handleFeatureChange(index, e.target.value)
                          }
                          className="ykb-field flex-1"
                          placeholder={`Feature ${index + 1}`}
                        />
                        {formData.features.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(index)}
                            className="px-3 py-2 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="mt-2 text-sm text-primary hover:text-primary/80 font-semibold"
                  >
                    + Add Feature
                  </button>
                </div>

                {/* Fees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Fee (RWF) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.feeRwf}
                      onChange={(e) =>
                        setFormData({ ...formData, feeRwf: e.target.value })
                      }
                      className="ykb-field"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Fee (USD) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.feeUsd}
                      onChange={(e) =>
                        setFormData({ ...formData, feeUsd: e.target.value })
                      }
                      className="ykb-field"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving...'
                      : editingId
                        ? 'Update Plan'
                        : 'Create Plan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 border border-border bg-surface text-textSecondary font-semibold py-2.5 rounded-md hover:bg-surface/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Plans List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : plans.length > 0 ? (
            <div className="space-y-4">
              {plans.map((plan) => (
                <div key={plan.id} className="ykb-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary mb-2">
                        {plan.title}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-textSecondary">Fee (RWF)</p>
                          <p className="text-lg font-semibold text-primary">
                            {plan.feeRwf.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-textSecondary">Fee (USD)</p>
                          <p className="text-lg font-semibold text-primary">
                            ${plan.feeUsd.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-textSecondary mb-2">
                          Features:
                        </p>
                        <ul className="space-y-1">
                          {plan.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-textSecondary flex items-start gap-2"
                            >
                              <span className="text-secondary mt-1">•</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        title="Edit plan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="p-2 rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 ykb-card">
              <AlertCircle className="w-12 h-12 text-textSecondary mx-auto mb-4" />
              <p className="text-textSecondary mb-4">
                No plans created yet.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Plan
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
