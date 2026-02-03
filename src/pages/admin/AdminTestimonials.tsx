import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminTestimonials() {
  const testimonials = useQuery(api.testimonials.list) ?? [];
  const pressQuotes = useQuery(api.pressQuotes.list) ?? [];
  const createTestimonial = useMutation(api.testimonials.create);
  const updateTestimonial = useMutation(api.testimonials.update);
  const removeTestimonial = useMutation(api.testimonials.remove);
  const createPress = useMutation(api.pressQuotes.create);
  const updatePress = useMutation(api.pressQuotes.update);
  const removePress = useMutation(api.pressQuotes.remove);

  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialAuthor, setTestimonialAuthor] = useState('');
  const [pressText, setPressText] = useState('');
  const [pressSource, setPressSource] = useState('');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl mb-4">Testimonials</h2>
        <div className="space-y-4">
          {testimonials.map((item) => (
            <div key={item._id} className="p-4 bg-white border border-[#111]/10 space-y-2">
              <textarea
                value={item.text}
                onChange={(e) => updateTestimonial({ id: item._id, text: e.target.value })}
                className="w-full border border-[#111]/10 px-3 py-2 text-sm min-h-16"
              />
              <input
                value={item.author}
                onChange={(e) => updateTestimonial({ id: item._id, author: e.target.value })}
                className="w-full border border-[#111]/10 px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) => updateTestimonial({ id: item._id, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <button
                  className="px-3 py-1 text-xs border border-red-200 text-red-500"
                  onClick={() => removeTestimonial({ id: item._id })}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-white/80 border border-[#111]/10 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createTestimonial({
                text: testimonialText,
                author: testimonialAuthor,
                enabled: true,
              });
              setTestimonialText('');
              setTestimonialAuthor('');
            }}
            className="space-y-3"
          >
            <textarea
              value={testimonialText}
              onChange={(e) => setTestimonialText(e.target.value)}
              placeholder="Testimonial"
              className="w-full border border-[#111]/10 px-3 py-2 text-sm min-h-16"
            />
            <input
              value={testimonialAuthor}
              onChange={(e) => setTestimonialAuthor(e.target.value)}
              placeholder="Author"
              className="w-full border border-[#111]/10 px-3 py-2 text-sm"
            />
            <button className="btn-primary" type="submit">
              Add Testimonial
            </button>
          </form>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl mb-4">Press Quotes</h2>
        <div className="space-y-4">
          {pressQuotes.map((item) => (
            <div key={item._id} className="p-4 bg-white border border-[#111]/10 space-y-2">
              <textarea
                value={item.text}
                onChange={(e) => updatePress({ id: item._id, text: e.target.value })}
                className="w-full border border-[#111]/10 px-3 py-2 text-sm min-h-16"
              />
              <input
                value={item.source}
                onChange={(e) => updatePress({ id: item._id, source: e.target.value })}
                className="w-full border border-[#111]/10 px-3 py-2 text-sm"
              />
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.enabled !== false}
                    onChange={(e) => updatePress({ id: item._id, enabled: e.target.checked })}
                  />
                  Enabled
                </label>
                <button
                  className="px-3 py-1 text-xs border border-red-200 text-red-500"
                  onClick={() => removePress({ id: item._id })}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-white/80 border border-[#111]/10 p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await createPress({
                text: pressText,
                source: pressSource,
                enabled: true,
              });
              setPressText('');
              setPressSource('');
            }}
            className="space-y-3"
          >
            <textarea
              value={pressText}
              onChange={(e) => setPressText(e.target.value)}
              placeholder="Quote"
              className="w-full border border-[#111]/10 px-3 py-2 text-sm min-h-16"
            />
            <input
              value={pressSource}
              onChange={(e) => setPressSource(e.target.value)}
              placeholder="Source"
              className="w-full border border-[#111]/10 px-3 py-2 text-sm"
            />
            <button className="btn-primary" type="submit">
              Add Quote
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
