import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function AccountProfile() {
  const profile = useQuery(api.userProfiles.get);
  const upsert = useMutation(api.userProfiles.upsert);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    setLine1(profile?.shipping_address?.line1 ?? '');
    setLine2(profile?.shipping_address?.line2 ?? '');
    setCity(profile?.shipping_address?.city ?? '');
    setState(profile?.shipping_address?.state ?? '');
    setPostalCode(profile?.shipping_address?.postal_code ?? '');
    setCountry(profile?.shipping_address?.country ?? '');
  }, [profile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await upsert({
      full_name: fullName,
      phone,
      shipping_address: {
        line1,
        line2,
        city,
        state,
        postal_code: postalCode,
        country,
      },
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display text-xl">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <input
          value={line1}
          onChange={(e) => setLine1(e.target.value)}
          placeholder="Address line 1"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <input
          value={line2}
          onChange={(e) => setLine2(e.target.value)}
          placeholder="Address line 2"
          className="w-full border border-[#111]/10 px-3 py-2"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Postal code"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Country"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
        </div>
        <button className="btn-primary" type="submit">
          Save Profile
        </button>
      </form>
    </div>
  );
}
