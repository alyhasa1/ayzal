import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import FormField, { fieldInputClass, fieldTextareaClass } from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';

export default function AdminSettings() {
  const settingsRaw = useQuery(api.siteSettings.get);
  const upsertSettings = useMutation(api.siteSettings.upsert);
  const { toast } = useToast();

  const [brandName, setBrandName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [footerLinks, setFooterLinks] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoOgImage, setSeoOgImage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = settingsRaw?.data ?? {};
    setBrandName(data.brand_name ?? '');
    setContactEmail(data.contact_email ?? '');
    setContactPhone(data.contact_phone ?? '');
    setContactLocation(data.contact_location ?? '');
    setFooterLinks(JSON.stringify(data.footer_links ?? { shop: [], help: [], company: [] }, null, 2));
    setSocialLinks(JSON.stringify(data.social_links ?? { instagram: '', facebook: '' }, null, 2));
    setSeoTitle(data.seo?.title ?? '');
    setSeoDescription(data.seo?.description ?? '');
    setSeoKeywords(data.seo?.keywords ?? '');
    setSeoOgImage(data.seo?.og_image ?? '');
  }, [settingsRaw]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const footer_links = JSON.parse(footerLinks || '{}');
      const social_links = JSON.parse(socialLinks || '{}');
      await upsertSettings({
        data: {
          brand_name: brandName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          contact_location: contactLocation,
          footer_links,
          social_links,
          seo: {
            title: seoTitle,
            description: seoDescription,
            keywords: seoKeywords,
            og_image: seoOgImage,
          },
        },
      });
      toast('Settings saved');
    } catch (err: any) {
      toast(err?.message ?? 'Invalid JSON — check footer/social fields', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-display text-xl">Site Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-5 text-sm">
        <div className="bg-white border border-[#111]/10 p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Brand & Contact</p>
          <FormField label="Brand Name">
            <input value={brandName} onChange={(e) => setBrandName(e.target.value)} className={fieldInputClass} />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Contact Email">
              <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={fieldInputClass} />
            </FormField>
            <FormField label="Contact Phone">
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={fieldInputClass} />
            </FormField>
          </div>
          <FormField label="Contact Location">
            <input value={contactLocation} onChange={(e) => setContactLocation(e.target.value)} className={fieldInputClass} />
          </FormField>
        </div>

        <div className="bg-white border border-[#111]/10 p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">SEO Defaults</p>
          <FormField label="Default Page Title">
            <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={fieldInputClass} />
          </FormField>
          <FormField label="Default Meta Description">
            <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={`${fieldTextareaClass} min-h-20`} />
          </FormField>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <FormField label="Meta Keywords" hint="Comma-separated">
              <input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} className={fieldInputClass} />
            </FormField>
            <FormField label="OG Image Path" hint="e.g. /og.png">
              <input value={seoOgImage} onChange={(e) => setSeoOgImage(e.target.value)} className={fieldInputClass} />
            </FormField>
          </div>
        </div>

        <div className="bg-white border border-[#111]/10 p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Footer & Social</p>
          <FormField label="Footer Links" hint="JSON object with shop, help, company arrays">
            <textarea
              value={footerLinks}
              onChange={(e) => setFooterLinks(e.target.value)}
              className={`${fieldTextareaClass} min-h-32 font-mono text-xs`}
            />
          </FormField>
          <FormField label="Social Links" hint="JSON object e.g. { instagram: '', facebook: '' }">
            <textarea
              value={socialLinks}
              onChange={(e) => setSocialLinks(e.target.value)}
              className={`${fieldTextareaClass} min-h-24 font-mono text-xs`}
            />
          </FormField>
        </div>

        <button className="btn-primary" type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
