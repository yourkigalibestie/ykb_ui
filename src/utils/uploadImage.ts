import { getBackendAuthHeaders, getBackendAccessToken } from './backendAuth';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export type UploadResult = {
  url: string;
  publicId: string;
};

export async function uploadServiceImage(file: File): Promise<UploadResult> {
  const token = getBackendAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please log in first.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const headers = getBackendAuthHeaders();
  console.log('Upload request:', {
    endpoint: `${API_BASE}/uploads/service-image`,
    fileSize: file.size,
    fileType: file.type,
    hasToken: !!token,
  });

  const response = await fetch(`${API_BASE}/uploads/service-image`, {
    method: 'POST',
    headers,
    body: formData,
  });

  console.log('Upload response status:', response.status);
  const responseText = await response.text();
  console.log('Upload response body:', responseText);

  if (!response.ok) {
    let errorMessage = `Upload failed (${response.status})`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData?.error?.message || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error('Invalid response format from server');
  }

  console.log('Upload data:', data);

  // Handle the response structure from backend: { upload: { url, publicId } }
  const uploadData = data?.upload;
  if (!uploadData?.url || !uploadData?.publicId) {
    console.error('Invalid upload response structure:', data);
    throw new Error('Server returned invalid response. Missing image URL or ID.');
  }

  return {
    url: uploadData.url,
    publicId: uploadData.publicId,
  };
}
