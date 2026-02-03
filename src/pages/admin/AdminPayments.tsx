import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AdminPayments() {
  const methods = useQuery(api.paymentMethods.list) ?? [];
  const updateMethod = useMutation(api.paymentMethods.update);
  const createMethod = useMutation(api.paymentMethods.create);

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [instructions, setInstructions] = useState('');
  const [active, setActive] = useState(true);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMethod({ key, label, instructions, active, sort_order: Date.now() });
    setKey('');
    setLabel('');
    setInstructions('');
    setActive(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.6fr] gap-8">
      <div className="space-y-4">
        <h2 className="font-display text-xl">Payment Methods</h2>
        {methods.map((method) => (
          <div key={method._id} className="p-4 bg-white border border-[#111]/10 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{method.label}</p>
                <p className="text-xs text-[#6E6E6E]">Key: {method.key}</p>
              </div>
              <label className="text-xs uppercase tracking-widest flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={method.active}
                  onChange={(e) => updateMethod({ id: method._id, active: e.target.checked })}
                />
                Active
              </label>
            </div>
            <textarea
              value={method.instructions ?? ''}
              onChange={(e) => updateMethod({ id: method._id, instructions: e.target.value })}
              className="w-full border border-[#111]/10 px-3 py-2 text-sm min-h-20"
            />
            <input
              value={method.label}
              onChange={(e) => updateMethod({ id: method._id, label: e.target.value })}
              className="w-full border border-[#111]/10 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="bg-white/80 border border-[#111]/10 p-6">
        <h3 className="font-display text-lg mb-4">Add Payment Method</h3>
        <form onSubmit={handleCreate} className="space-y-4 text-sm">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Key (e.g. bank_transfer)"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions"
            className="w-full border border-[#111]/10 px-3 py-2 min-h-20"
          />
          <label className="text-xs uppercase tracking-widest flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <button className="btn-primary w-full" type="submit">Create</button>
        </form>
      </div>
    </div>
  );
}
