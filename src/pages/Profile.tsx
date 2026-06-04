import { useEffect, useState, type ReactNode } from 'react';
import { MapPin, Mail, Phone, Shield, UserCircle2, Upload, Eye, EyeOff, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBackendSession, fetchBackendMe, updateUserProfile, requestEmailChange, verifyEmailChange, type BackendUser } from '../utils/backendAuth';
import { fetchProviderMeProfile, updateProviderMeProfile, uploadProviderProfileImage, type BackendProviderProfile } from '../utils/backendProviders';

function FieldRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-surface px-3 py-2">
      {icon ? <div className="mt-0.5 text-primary">{icon}</div> : null}
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-textSecondary">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value}</div>
      </div>
    </div>
  );
}

type EditMode = 'none' | 'profile' | 'email' | 'provider';

export function Profile() {
  const backendSession = getBackendSession();
  const isBackendAuthenticated = Boolean(backendSession?.accessToken);

  const [backendUser, setBackendUser] = useState<BackendUser | null>(backendSession?.user ?? null);
  const [backendProvider, setBackendProvider] = useState<BackendProviderProfile | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  
  // Email change form state
  const [emailForm, setEmailForm] = useState({ newEmail: '', code: '', step: 'request' as 'request' | 'verify', showCode: false });
  
  // Provider form state
  const [providerForm, setProviderForm] = useState({
    businessName: '',
    mainService: '',
    location: '',
    moneyRange: '',
    bio: '',
    profileImageUrl: '',
    profileImagePublicId: '',
  });
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

    useEffect(() => {
    if (typeof window === 'undefined') return;

    const existingScript = document.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6"]');
    if (existingScript) return;

    const externalScript = document.createElement('script');
    externalScript.async = true;
    externalScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-5T7DTFNYP6';
    document.head.appendChild(externalScript);

    const inlineScript = document.createElement('script');
    inlineScript.text = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-5T7DTFNYP6');`;
    document.head.appendChild(inlineScript);

    return () => {
      document.head.removeChild(externalScript);
      document.head.removeChild(inlineScript);
    };
  }, []);
  // Load user data
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!isBackendAuthenticated) return;

      try {
        const user = await fetchBackendMe();
        if (!mounted) return;

        setBackendUser(user);
        setProfileForm({ name: user.name || '', phone: user.phone || '' });

        if (user.role === 'PROVIDER') {
          const provider = await fetchProviderMeProfile();
          if (!mounted) return;
          setBackendProvider(provider);
          setProviderForm({
            businessName: provider.businessName || '',
            mainService: provider.mainService || '',
            location: provider.location || '',
            moneyRange: provider.moneyRange || '',
            bio: provider.bio || '',
            profileImageUrl: provider.profileImageUrl || '',
            profileImagePublicId: provider.profileImagePublicId || '',
          });
          setImagePreview(provider.profileImageUrl || null);
        } else {
          setBackendProvider(null);
        }
      } catch (err) {
        if (!mounted) return;
        setBackendProvider(null);
        setBackendUser(backendSession?.user ?? null);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [backendSession?.user?.role, isBackendAuthenticated]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateUserProfile({
        name: profileForm.name || undefined,
        phone: profileForm.phone || null,
      });
      setBackendUser(updated);
      setSuccess('Profile updated successfully!');
      setEditMode('none');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await requestEmailChange(emailForm.newEmail);
      setEmailForm({ ...emailForm, step: 'verify' });
      setSuccess('Verification code sent to your new email!');
    } catch (err: any) {
      setError(err.message || 'Failed to request email change');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChangeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await verifyEmailChange(emailForm.newEmail, emailForm.code);
      setBackendUser(updated);
      setSuccess('Email changed successfully!');
      setEmailForm({ newEmail: '', code: '', step: 'request', showCode: false });
      setEditMode('none');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify email change');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProviderImageUpload = async () => {
    if (!imageFile) return;

    setLoading(true);
    setError(null);

    try {
      const upload = await uploadProviderProfileImage(imageFile);
      setProviderForm({
        ...providerForm,
        profileImageUrl: upload.url,
        profileImagePublicId: upload.publicId,
      });
      setBackendProvider((current) =>
        current
          ? {
              ...current,
              profileImageUrl: upload.url,
              profileImagePublicId: upload.publicId,
            }
          : current,
      );
      setImageFile(null);
      setImagePreview(upload.url);
      setSuccess('Image uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProviderMeProfile({
        businessName: providerForm.businessName || null,
        mainService: providerForm.mainService || null,
        location: providerForm.location || null,
        moneyRange: providerForm.moneyRange || null,
        bio: providerForm.bio || null,
        profileImageUrl: providerForm.profileImageUrl || null,
        profileImagePublicId: providerForm.profileImagePublicId || null,
      });
      setBackendProvider(updated);
      setSuccess('Provider profile updated successfully!');
      setEditMode('none');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update provider profile');
    } finally {
      setLoading(false);
    }
  };

  const currentRole = backendUser?.role ?? backendSession?.user?.role ?? 'CUSTOMER';
  const displayName = backendUser?.name ?? backendSession?.user?.name ?? 'Profile';
  const profileImageUrl = providerForm.profileImageUrl || backendProvider?.profileImageUrl || imagePreview;

  return (
    <main className="pt-16">
      <section className="ykb-section px-2 sm:px-6 lg:px-8 bg-dark-light">
        <h1 className='text-3xl md:text-4xl font-serif text-start font-bold text-primary mb-2'>Profile</h1>
        <div className="ykb-container mx-0">
          <div className="grid grid-cols-1 gap-6">
            {/* Alerts */}
            {error && (
              <div className="ykb-alert ykb-alert-error">
                {error}
              </div>
            )}
            {success && (
              <div className="ykb-alert ykb-alert-success">
                {success}
              </div>
            )}

            {/* Main Profile Card */}
            <div className="ykb-card p-4">
              {isBackendAuthenticated ? (
                <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2">
                  <div className="mt-1 text-sm text-gray-900 break-words">{backendSession?.user?.email}</div>
                  <div className="mt-1 text-xs text-textSecondary">
                    Role: <span className="font-semibold text-primary">{currentRole}</span>
                  </div>
                </div>
              ) : null}

              {!isBackendAuthenticated ? (
                <div className="ykb-alert ykb-alert-info">
                  Please log in to view your profile.
                  <div className="mt-4">
                    <Link to="/login" className="ykb-button-primary">Go to login</Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
                    <div className="flex-shrink-0 flex flex-col items-center gap-3">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt={displayName}
                          className="h-40 w-40 rounded-full object-cover border border-border shadow-sm bg-surface"
                        />
                      ) : (
                        <div className="h-40 w-40 rounded-full border border-border bg-[#d8dbdf] shadow-sm flex items-center justify-center overflow-hidden">
                          <UserCircle2 className="h-36 w-36 text-[#aeb4ba]" strokeWidth={1.2} />
                        </div>
                      )}

                      <label htmlFor="image-input" className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm cursor-pointer hover:bg-surface/80 transition">
                        <Upload className="w-4 h-4" />
                        Change Profile Image
                      </label>
                      <input
                        id="image-input"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      {imageFile ? (
                        <>
                          <div className="max-w-40 text-xs text-textSecondary break-words text-center">
                            Selected: {imageFile.name}
                          </div>
                          <button
                            type="button"
                            onClick={handleProviderImageUpload}
                            disabled={loading}
                            className="ykb-button-primary text-sm w-full flex items-center justify-center gap-2"
                          >
                            {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                            {loading ? 'Saving...' : 'Save'}
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1 sm:pl-1">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <h2 className="text-xl font-bold text-primary">{displayName}</h2>
                        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                          <Shield className="w-4 h-4" />
                          {currentRole === 'PROVIDER' ? 'Service Provider' : currentRole === 'ADMIN' ? 'Admin' : 'Customer'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditMode(editMode === 'profile' ? 'none' : 'profile')}
                      className="ykb-button-secondary text-sm sm:self-start"
                    >
                      {editMode === 'profile' ? 'Cancel' : 'Edit'}
                    </button>
                  </div>

                  {/* Profile Edit Form */}
                  {editMode === 'profile' && (
                    <form onSubmit={handleProfileUpdate} className="mt-4 space-y-4 border-t border-border pt-4">
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">Name</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary mb-1">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="ykb-button-primary w-full flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  )}

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FieldRow label="Name" value={backendUser?.name ?? 'N/A'} icon={<UserCircle2 className="w-4 h-4" />} />
                    <FieldRow label="Email" value={backendUser?.email ?? 'N/A'} icon={<Mail className="w-4 h-4" />} />
                    <FieldRow label="Phone" value={backendUser?.phone ?? 'N/A'} icon={<Phone className="w-4 h-4" />} />
                    <FieldRow label="Role" value={currentRole} />
                  </div>

                  {/* Email Change Section */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-primary">Change Email</h3>
                      <button
                        onClick={() => setEditMode(editMode === 'email' ? 'none' : 'email')}
                        className="ykb-button-secondary text-sm"
                      >
                        {editMode === 'email' ? 'Cancel' : 'Change Email'}
                      </button>
                    </div>

                    {editMode === 'email' && (
                      <form onSubmit={emailForm.step === 'request' ? handleEmailChangeRequest : handleEmailChangeVerify} className="space-y-4">
                        {emailForm.step === 'request' ? (
                          <div>
                            <label className="block text-sm font-medium text-primary mb-1">New Email Address</label>
                            <input
                              type="email"
                              value={emailForm.newEmail}
                              onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="your-new-email@example.com"
                              required
                            />
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-primary mb-1">Verification Code</label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type={emailForm.showCode ? 'text' : 'password'}
                                    value={emailForm.code}
                                    onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Enter 6-character code"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setEmailForm({ ...emailForm, showCode: !emailForm.showCode })}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-primary"
                                  >
                                    {emailForm.showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-textSecondary mt-1">Check your new email for the verification code</p>
                            </div>
                          </>
                        )}
                        <button
                          type="submit"
                          disabled={loading}
                          className="ykb-button-primary w-full flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                          {loading ? 'Processing...' : emailForm.step === 'request' ? 'Send Verification Code' : 'Verify and Change Email'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Provider Profile Section */}
                  {currentRole === 'PROVIDER' ? (
                    <>
                      <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-primary">Provider Profile</h3>
                          <button
                            onClick={() => setEditMode(editMode === 'provider' ? 'none' : 'provider')}
                            className="ykb-button-secondary text-sm"
                          >
                            {editMode === 'provider' ? 'Cancel' : 'Edit Provider'}
                          </button>
                        </div>

                        {editMode === 'provider' && (
                          <form onSubmit={handleProviderUpdate} className="space-y-4 border border-border rounded-md p-4 bg-surface/50">
                            {/* Image Upload */}
                            <div>
                              <label className="block text-sm font-medium text-primary mb-2">Profile Image</label>
                              <div className="flex flex-col items-start gap-3">
                                <div className="flex-shrink-0">
                                  {imagePreview ? (
                                    <img
                                      src={imagePreview}
                                      alt="Preview"
                                      className="h-20 w-20 rounded-lg object-cover border border-border"
                                    />
                                  ) : (
                                    <div className="h-20 w-20 rounded-lg bg-gray-200 border border-border flex items-center justify-center">
                                      <UserCircle2 className="w-8 h-8 text-textSecondary" />
                                    </div>
                                  )}
                                </div>
                                <div className="w-full max-w-xs">
                                  <label htmlFor="image-input" className="flex items-center justify-center gap-2 px-3 py-2 border border-border rounded-md bg-surface cursor-pointer hover:bg-surface/80 transition">
                                    <Upload className="w-4 h-4" />
                                    Change Profile Image
                                  </label>
                                  <input
                                    id="image-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                  />
                                  {imageFile ? (
                                    <>
                                      <div className="mt-2 text-xs text-textSecondary break-words">
                                        Selected: {imageFile.name}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={handleProviderImageUpload}
                                        disabled={loading}
                                        className="ykb-button-primary text-sm mt-2 w-full flex items-center justify-center gap-2"
                                      >
                                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                                        {loading ? 'Saving...' : 'Save'}
                                      </button>
                                    </>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-primary mb-1">Business Name</label>
                              <input
                                type="text"
                                value={providerForm.businessName}
                                onChange={(e) => setProviderForm({ ...providerForm, businessName: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-primary mb-1">Main Service</label>
                              <input
                                type="text"
                                value={providerForm.mainService}
                                onChange={(e) => setProviderForm({ ...providerForm, mainService: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-primary mb-1">Location</label>
                              <input
                                type="text"
                                value={providerForm.location}
                                onChange={(e) => setProviderForm({ ...providerForm, location: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-primary mb-1">Money Range</label>
                              <input
                                type="text"
                                value={providerForm.moneyRange}
                                onChange={(e) => setProviderForm({ ...providerForm, moneyRange: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-primary mb-1">Bio</label>
                              <textarea
                                value={providerForm.bio}
                                onChange={(e) => setProviderForm({ ...providerForm, bio: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                rows={3}
                                placeholder="Tell customers about your services..."
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={loading}
                              className="ykb-button-primary w-full flex items-center justify-center gap-2"
                            >
                              {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                              {loading ? 'Saving...' : 'Save Provider Profile'}
                            </button>
                          </form>
                        )}

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                          <FieldRow label="Business Name" value={backendProvider?.businessName ?? 'N/A'} />
                          <FieldRow label="Main Service" value={backendProvider?.mainService ?? 'N/A'} />
                          <FieldRow label="Location" value={backendProvider?.location ?? 'N/A'} icon={<MapPin className="w-4 h-4" />} />
                          <FieldRow label="Money Range" value={backendProvider?.moneyRange ?? 'N/A'} />
                        </div>
                        {backendProvider?.bio && (
                          <div className="mt-2 rounded-md border border-border bg-surface px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-textSecondary">Bio</div>
                            <div className="mt-1 text-sm text-gray-900">{backendProvider.bio}</div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
