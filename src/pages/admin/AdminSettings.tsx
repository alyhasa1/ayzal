import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import FormField, { fieldInputClass, fieldTextareaClass } from '@/components/admin/FormField';
import { useToast } from '@/components/admin/Toast';

const defaultFooterLinks = {
  shop: [
    { label: 'New Arrivals', href: '/search?sort=newest' },
    { label: 'Formals', href: '/category/formals' },
    { label: 'Ready-to-Wear', href: '/category/ready-to-wear' },
    { label: 'Bridal', href: '/category/bridal' },
    { label: 'Accessories', href: '/search?q=accessories' },
  ],
  help: [
    { label: 'Shipping', href: '/pages/shipping' },
    { label: 'Returns', href: '/pages/returns-policy' },
    { label: 'Size Guide', href: '/pages/size-guide' },
    { label: 'FAQ', href: '/pages/faq' },
    { label: 'Contact Us', href: '/support' },
  ],
  company: [
    { label: 'About Us', href: '/pages/about-us' },
    { label: 'Careers', href: '/pages/careers' },
    { label: 'Press', href: '/blog' },
    { label: 'Sustainability', href: '/pages/sustainability' },
  ],
};

const defaultContentPages = [
  {
    slug: 'about-us',
    title: 'About Ayzal',
    meta_title: 'About Ayzal Collections',
    meta_description: 'Learn about Ayzal Collections, our craft, and our quality standards.',
    body: 'Ayzal Collections creates premium Pakistani fashion with modern craftsmanship.',
    updated_at: Date.now(),
    published: true,
  },
];

const defaultBlogPosts = [
  {
    slug: 'summer-lawn-care-guide',
    title: 'Summer Lawn Care Guide for Pakistani Dresses',
    excerpt: 'Protect your lawn suits from heat, humidity, and color fade with these practical tips.',
    content:
      'Lawn fabrics need gentle washing and shade drying to maintain color depth.\n\nUse breathable storage bags and avoid direct sunlight for long periods.',
    author: 'Ayzal Editorial',
    tags: ['lawn', 'care', 'pakistan-fashion'],
    cover_image: '/og.png',
    published_at: Date.now(),
    updated_at: Date.now(),
    published: true,
  },
];

const defaultRedirectRules = [
  { from: '/size-chart', to: '/pages/size-guide', status: 301 },
];

export default function AdminSettings() {
  const settingsRaw = useQuery(api.siteSettings.get);
  const seoHealth = useQuery(api.content.seoHealthReport);
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
  const [contentPages, setContentPages] = useState('');
  const [blogPosts, setBlogPosts] = useState('');
  const [redirectRules, setRedirectRules] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const data = settingsRaw?.data ?? {};
    setBrandName(data.brand_name ?? '');
    setContactEmail(data.contact_email ?? '');
    setContactPhone(data.contact_phone ?? '');
    setContactLocation(data.contact_location ?? '');
    setFooterLinks(JSON.stringify(data.footer_links ?? defaultFooterLinks, null, 2));
    setSocialLinks(JSON.stringify(data.social_links ?? { instagram: '', facebook: '' }, null, 2));
    setSeoTitle(data.seo?.title ?? '');
    setSeoDescription(data.seo?.description ?? '');
    setSeoKeywords(data.seo?.keywords ?? '');
    setSeoOgImage(data.seo?.og_image ?? '');
    setContentPages(JSON.stringify(data.content_pages ?? defaultContentPages, null, 2));
    setBlogPosts(JSON.stringify(data.blog_posts ?? defaultBlogPosts, null, 2));
    setRedirectRules(JSON.stringify(data.redirect_rules ?? defaultRedirectRules, null, 2));
  }, [settingsRaw]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const existingData = settingsRaw?.data ?? {};
      const footer_links = JSON.parse(footerLinks || '{}');
      const social_links = JSON.parse(socialLinks || '{}');
      const content_pages = JSON.parse(contentPages || '[]');
      const blog_posts = JSON.parse(blogPosts || '[]');
      const redirect_rules = JSON.parse(redirectRules || '[]');

      if (!Array.isArray(content_pages)) throw new Error('Content pages must be a JSON array');
      if (!Array.isArray(blog_posts)) throw new Error('Blog posts must be a JSON array');
      if (!Array.isArray(redirect_rules)) throw new Error('Redirect rules must be a JSON array');

      await upsertSettings({
        data: {
          ...existingData,
          brand_name: brandName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          contact_location: contactLocation,
          footer_links,
          social_links,
          content_pages,
          blog_posts,
          redirect_rules,
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
      toast(err?.message ?? 'Invalid JSON - check settings fields', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-display text-xl">Site Settings</h2>

      <div className="bg-white border border-[#111]/10 p-5 space-y-4">
        <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">SEO Health Monitor</p>
        {seoHealth ? (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="border border-[#111]/10 p-3">
                <p className="text-[11px] uppercase tracking-widest text-[#6E6E6E]">Known Paths</p>
                <p className="font-medium text-[#111] mt-1">{seoHealth.summary.known_path_count}</p>
              </div>
              <div className="border border-[#111]/10 p-3">
                <p className="text-[11px] uppercase tracking-widest text-[#6E6E6E]">Checked Links</p>
                <p className="font-medium text-[#111] mt-1">{seoHealth.summary.checked_link_count}</p>
              </div>
              <div className="border border-[#111]/10 p-3">
                <p className="text-[11px] uppercase tracking-widest text-[#6E6E6E]">Broken Links</p>
                <p className="font-medium text-[#111] mt-1">{seoHealth.summary.broken_link_count}</p>
              </div>
              <div className="border border-[#111]/10 p-3">
                <p className="text-[11px] uppercase tracking-widest text-[#6E6E6E]">Redirects</p>
                <p className="font-medium text-[#111] mt-1">{seoHealth.summary.redirect_count}</p>
              </div>
              <div className="border border-[#111]/10 p-3">
                <p className="text-[11px] uppercase tracking-widest text-[#6E6E6E]">Redirect Issues</p>
                <p className="font-medium text-[#111] mt-1">{seoHealth.summary.redirect_issue_count}</p>
              </div>
            </div>

            {seoHealth.broken_links.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Broken Internal Links</p>
                <div className="max-h-40 overflow-auto border border-[#111]/10">
                  {seoHealth.broken_links.map((issue: any, index: number) => (
                    <div key={`${issue.source}-${index}`} className="px-3 py-2 border-b border-[#111]/10 last:border-b-0">
                      <p className="font-mono text-xs text-[#111]">{issue.href}</p>
                      <p className="text-xs text-[#6E6E6E]">{issue.source} - {issue.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-600">No broken internal links detected in monitored surfaces.</p>
            )}

            {seoHealth.redirect_issues.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Redirect Issues</p>
                <div className="max-h-40 overflow-auto border border-[#111]/10">
                  {seoHealth.redirect_issues.map((issue: any, index: number) => (
                    <div key={`${issue.type}-${index}`} className="px-3 py-2 border-b border-[#111]/10 last:border-b-0">
                      <p className="font-mono text-xs text-[#111]">
                        {issue.from ?? "-"} {"->"} {issue.to ?? "-"}
                      </p>
                      <p className="text-xs text-[#6E6E6E]">{issue.type} - {issue.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-emerald-600">No redirect issues detected.</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#6E6E6E]">Loading SEO health report...</p>
        )}
      </div>

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
          <FormField label="Footer Links" hint="JSON object with shop, help, company arrays of {label, href}">
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

        <div className="bg-white border border-[#111]/10 p-5 space-y-4">
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E] font-medium">Content & Growth</p>
          <FormField label="Content Pages" hint="JSON array for /pages/:slug (legal pages, FAQs, policies)">
            <textarea
              value={contentPages}
              onChange={(e) => setContentPages(e.target.value)}
              className={`${fieldTextareaClass} min-h-32 font-mono text-xs`}
            />
          </FormField>
          <FormField label="Blog Posts" hint="JSON array for /blog and /blog/:slug">
            <textarea
              value={blogPosts}
              onChange={(e) => setBlogPosts(e.target.value)}
              className={`${fieldTextareaClass} min-h-32 font-mono text-xs`}
            />
          </FormField>
          <FormField label="Redirect Rules" hint="JSON array placeholder for future redirect manager">
            <textarea
              value={redirectRules}
              onChange={(e) => setRedirectRules(e.target.value)}
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
