import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminSettings() {
  const settingsRaw = useQuery(api.siteSettings.get);
  const upsertSettings = useMutation(api.siteSettings.upsert);

  const [brandName, setBrandName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactLocation, setContactLocation] = useState('');
  const [footerLinks, setFooterLinks] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = settingsRaw?.data ?? {};
    setBrandName(data.brand_name ?? '');
    setContactEmail(data.contact_email ?? '');
    setContactPhone(data.contact_phone ?? '');
    setContactLocation(data.contact_location ?? '');
    setFooterLinks(JSON.stringify(data.footer_links ?? { shop: [], help: [], company: [] }, null, 2));
    setSocialLinks(JSON.stringify(data.social_links ?? { instagram: '', facebook: '' }, null, 2));
  }, [settingsRaw]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
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
        },
      });
    } catch (err: any) {
      setError(err?.message ?? 'Invalid JSON');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-display text-xl">Site Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <input
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="Brand name"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <input
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          placeholder="Contact email"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Contact phone"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <input
          value={contactLocation}
          onChange={(e) => setContactLocation(e.target.value)}
          placeholder="Contact location"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <label className="label-text text-[#6E6E6E]">Footer links JSON</label>
        <textarea
          value={footerLinks}
          onChange={(e) => setFooterLinks(e.target.value)}
          className="w-full border border-[#111]/10 px-3 py-2 min-h-32 font-mono text-xs"
        />
        <label className="label-text text-[#6E6E6E]">Social links JSON</label>
        <textarea
          value={socialLinks}
          onChange={(e) => setSocialLinks(e.target.value)}
          className="w-full border border-[#111]/10 px-3 py-2 min-h-24 font-mono text-xs"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button className="btn-primary" type="submit">
          Save Settings
        </button>
      </form>
    </div>
  );
}
