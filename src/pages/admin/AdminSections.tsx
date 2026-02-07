import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useAuthToken } from '@convex-dev/auth/react';
import { api } from '../../../convex/_generated/api';
import FormField, {
  fieldInputClass,
  fieldSelectClass,
  fieldTextareaClass,
} from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';
import { Check, ChevronDown, ChevronUp, Copy, ImageUp } from 'lucide-react';

function validateJson(str: string): string | null {
  try {
    JSON.parse(str);
    return null;
  } catch (err: any) {
    const msg = err?.message ?? 'Invalid JSON';
    const match = msg.match(/position (\d+)/);
    if (match) {
      const pos = Number(match[1]);
      const line = str.substring(0, pos).split('\n').length;
      return `${msg} (around line ${line})`;
    }
    return msg;
  }
}

function parseObjectDraft(str: string) {
  const parsed = JSON.parse(str);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Section data must be a JSON object');
  }
  return parsed as Record<string, unknown>;
}

function listImageFieldPaths(value: unknown, prefix = '', depth = 0): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  if (depth > 4) return [];
  const out: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (/image|cover|banner|thumbnail|hero|photo|background/i.test(key)) {
      if (
        typeof nested === 'string' ||
        nested === null ||
        nested === undefined ||
        typeof nested === 'number'
      ) {
        out.push(path);
      }
    }
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      out.push(...listImageFieldPaths(nested, path, depth + 1));
    }
  }
  return out;
}

function getValueAtPath(value: unknown, path: string) {
  const parts = path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return undefined;

  let cursor: any = value;
  for (const part of parts) {
    if (!cursor || typeof cursor !== 'object') return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function setValueAtPath(target: Record<string, unknown>, path: string, value: string) {
  const parts = path
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Choose a valid field path');
  }

  let cursor: any = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const part = parts[index];
    if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }

  cursor[parts[parts.length - 1]] = value;
}

function isUrlLike(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith('/');
}

type UploadResult = {
  url: string;
  key?: string;
};

export default function AdminSections() {
  const sectionsRawQuery = useQuery(api.siteSections.list);
  const updateSection = useMutation(api.siteSections.update);
  const authToken = useAuthToken();
  const { toast } = useToast();

  const sections = useMemo(
    () => [...(sectionsRawQuery ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [sectionsRawQuery]
  );

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [uploadingBySection, setUploadingBySection] = useState<Record<string, boolean>>({});
  const [selectedFieldPaths, setSelectedFieldPaths] = useState<Record<string, string>>({});
  const [customFieldPaths, setCustomFieldPaths] = useState<Record<string, string>>({});
  const [uploadResults, setUploadResults] = useState<Record<string, UploadResult>>({});

  const getDraft = (section: any) =>
    drafts[section._id] ?? JSON.stringify(section.data ?? {}, null, 2);

  const getJsonError = (sectionId: string) => {
    const draft = drafts[sectionId];
    if (!draft) return null;
    return validateJson(draft);
  };

  const getParsedSectionData = (section: any) => {
    try {
      return parseObjectDraft(getDraft(section));
    } catch {
      return (section.data ?? {}) as Record<string, unknown>;
    }
  };

  const getResolvedFieldPath = (sectionId: string, fallbackPath: string) => {
    const customPath = customFieldPaths[sectionId]?.trim();
    if (customPath) return customPath;
    return selectedFieldPaths[sectionId] ?? fallbackPath;
  };

  const handleSave = async (sectionId: string) => {
    const section = sections.find((item) => item._id === sectionId);
    if (!section) return;

    const draft = getDraft(section);
    const err = validateJson(draft);
    if (err) {
      toast(err, 'error');
      return;
    }
    setSavingId(sectionId);
    try {
      const parsed = JSON.parse(draft);
      await updateSection({ id: sectionId as any, data: parsed });
      toast('Section saved');
      setDrafts((prev) => {
        const n = { ...prev };
        delete n[sectionId];
        return n;
      });
    } catch (e: any) {
      toast(e?.message ?? 'Failed to save', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleUploadForSection = async (section: any, fallbackPath: string) => {
    const jsonErr = getJsonError(section._id);
    if (jsonErr) {
      toast('Please fix JSON before uploading', 'error');
      return;
    }

    const file = selectedFiles[section._id];
    if (!file) {
      toast('Choose an image file first', 'error');
      return;
    }

    const fieldPath = getResolvedFieldPath(section._id, fallbackPath).trim();
    if (!fieldPath) {
      toast('Choose a field path first', 'error');
      return;
    }

    setUploadingBySection((prev) => ({ ...prev, [section._id]: true }));
    try {
      const formData = new FormData();
      formData.set('file', file, file.name);
      formData.set('section_key', section.key);
      formData.set('field_path', fieldPath);
      formData.set('folder', `sections/${section.key}`);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : undefined,
        body: formData,
      });
      const payload = await response.json().catch(() => ({} as any));
      if (!response.ok || !payload?.ok || !payload?.url) {
        throw new Error(payload?.error ?? 'Upload failed');
      }

      const baseObject = parseObjectDraft(getDraft(section));
      const updated = JSON.parse(JSON.stringify(baseObject)) as Record<string, unknown>;
      setValueAtPath(updated, fieldPath, String(payload.url));
      const serializedUpdated = JSON.stringify(updated, null, 2);

      setDrafts((prev) => ({
        ...prev,
        [section._id]: serializedUpdated,
      }));
      setUploadResults((prev) => ({
        ...prev,
        [section._id]: {
          url: String(payload.url),
          key: typeof payload.key === 'string' ? payload.key : undefined,
        },
      }));
      setSelectedFiles((prev) => ({ ...prev, [section._id]: null }));

      // Publish immediately so storefront reflects the new image without extra manual save.
      try {
        setSavingId(section._id);
        await updateSection({ id: section._id as any, data: updated });
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[section._id];
          return next;
        });
        toast('Image uploaded and published');
      } catch (saveError: any) {
        toast(
          saveError?.message
            ? `Image uploaded, but save failed: ${saveError.message}. Click Save Section to publish.`
            : 'Image uploaded, but auto-save failed. Click Save Section to publish.',
          'error'
        );
      } finally {
        setSavingId(null);
      }
    } catch (error: any) {
      toast(error?.message ?? 'Image upload failed', 'error');
    } finally {
      setUploadingBySection((prev) => ({ ...prev, [section._id]: false }));
    }
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    const target = sections[index];
    const swapWith = sections[index + direction];
    if (!target || !swapWith) return;
    try {
      await updateSection({ id: target._id, sort_order: swapWith.sort_order });
      await updateSection({ id: swapWith._id, sort_order: target.sort_order });
      toast('Reordered');
    } catch (e: any) {
      toast(e?.message ?? 'Failed to reorder', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl">Site Sections</h2>
      {sections.map((section, index) => {
        const jsonErr = getJsonError(section._id);
        const isDirty = !!drafts[section._id];
        const isSaving = savingId === section._id;
        const sectionData = getParsedSectionData(section);
        const defaultCandidates = listImageFieldPaths(sectionData);
        const fallbackPath = defaultCandidates[0] ?? 'imageUrl';
        const currentFieldPath = getResolvedFieldPath(section._id, fallbackPath);
        const currentFieldValue = getValueAtPath(sectionData, currentFieldPath);
        const currentImageUrl =
          typeof currentFieldValue === 'string' && isUrlLike(currentFieldValue)
            ? currentFieldValue
            : uploadResults[section._id]?.url;
        const uploaded = uploadResults[section._id];
        const uploading = !!uploadingBySection[section._id];

        return (
          <div key={section._id} className="p-4 bg-white border border-[#111]/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm uppercase tracking-widest">{section.key}</p>
                <p className="text-xs text-[#6E6E6E]">Position: {index + 1}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-1.5 border border-[#111]/10 hover:border-[#D4A05A] transition-colors disabled:opacity-30"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1.5 border border-[#111]/10 hover:border-[#D4A05A] transition-colors disabled:opacity-30"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === sections.length - 1}
                  title="Move down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <label className="text-xs uppercase tracking-widest flex items-center gap-2 ml-2">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) =>
                      updateSection({ id: section._id, enabled: event.target.checked })
                    }
                  />
                  Enabled
                </label>
              </div>
            </div>

            <div className="border border-[#111]/10 bg-[#F8F6F3] p-4 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Image Upload</p>
                {uploaded ? (
                  <span className="text-[11px] inline-flex items-center gap-1 text-emerald-700">
                    <Check className="w-3 h-3" />
                    Uploaded
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                <FormField
                  label="Target Field"
                  hint="Choose where the uploaded URL should be inserted in this section JSON."
                >
                  <select
                    className={fieldSelectClass}
                    value={selectedFieldPaths[section._id] ?? fallbackPath}
                    onChange={(event) =>
                      setSelectedFieldPaths((prev) => ({
                        ...prev,
                        [section._id]: event.target.value,
                      }))
                    }
                  >
                    {Array.from(new Set([fallbackPath, ...defaultCandidates])).map((path) => (
                      <option key={path} value={path}>
                        {path}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Custom Field Path"
                  hint="Optional. Use dot notation, for example: banner.desktop.imageUrl"
                >
                  <input
                    className={fieldInputClass}
                    value={customFieldPaths[section._id] ?? ''}
                    onChange={(event) =>
                      setCustomFieldPaths((prev) => ({
                        ...prev,
                        [section._id]: event.target.value,
                      }))
                    }
                    placeholder="imageUrl"
                  />
                </FormField>

                <FormField
                  label="Choose Image"
                  hint="Allowed: JPG, PNG, WEBP, AVIF, GIF, SVG. Max size follows upload config."
                  className="xl:col-span-2"
                >
                  <input
                    type="file"
                    accept="image/*"
                    className={`${fieldInputClass} file:mr-3 file:border-0 file:bg-[#111] file:text-white file:px-3 file:py-1.5 file:text-xs`}
                    onChange={(event) =>
                      setSelectedFiles((prev) => ({
                        ...prev,
                        [section._id]: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-primary text-xs inline-flex items-center gap-2"
                  onClick={() => handleUploadForSection(section, fallbackPath)}
                  disabled={uploading}
                >
                  <ImageUp className="w-3.5 h-3.5" />
                  {uploading ? 'Uploading...' : 'Upload and Insert URL'}
                </button>
                {uploaded?.url ? (
                  <button
                    type="button"
                    className="px-3 py-2 text-xs border border-[#111]/10 hover:border-[#D4A05A] transition-colors inline-flex items-center gap-2"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(uploaded.url);
                        toast('Image URL copied');
                      } catch {
                        toast('Unable to copy URL', 'error');
                      }
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy URL
                  </button>
                ) : null}
              </div>

              {uploaded?.key ? (
                <p className="text-xs text-[#6E6E6E]">
                  Stored key: <code>{uploaded.key}</code>
                </p>
              ) : null}

              {currentImageUrl ? (
                <div className="space-y-2">
                  <p className="text-xs text-[#6E6E6E]">
                    Preview from <code>{currentFieldPath}</code>
                  </p>
                  <div className="w-full max-w-sm h-44 bg-white border border-[#111]/10 overflow-hidden">
                    <img
                      src={currentImageUrl}
                      alt={`${section.key} preview`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <FormField label="Section Data (JSON)" error={jsonErr ?? undefined}>
              <textarea
                value={getDraft(section)}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [section._id]: event.target.value }))
                }
                className={`${fieldTextareaClass} min-h-32 font-mono text-xs ${
                  jsonErr ? 'border-red-300 focus:border-red-400' : ''
                }`}
              />
            </FormField>

            {isDirty && (
              <button
                className="btn-primary text-xs"
                onClick={() => handleSave(section._id)}
                disabled={isSaving || !!jsonErr}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
