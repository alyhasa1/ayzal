import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

type AddressId = Id<'user_addresses'>;

type AddressFormState = {
  label: string;
  recipient_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  make_default: boolean;
};

function emptyAddress(): AddressFormState {
  return {
    label: '',
    recipient_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Pakistan',
    make_default: false,
  };
}

function formatAddressLines(address: any) {
  const lines: string[] = [];
  if (address.line1) lines.push(address.line1);
  if (address.line2) lines.push(address.line2);
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  if (address.country) lines.push(address.country);
  return lines;
}

export default function AccountProfile() {
  const user = useQuery(api.users.me);
  const profile = useQuery(api.userProfiles.get);
  const addressBundle = useQuery(api.addresses.listForUser);

  const upsertProfile = useMutation(api.userProfiles.upsert);
  const createAddress = useMutation(api.addresses.create);
  const updateAddress = useMutation(api.addresses.update);
  const removeAddress = useMutation(api.addresses.remove);
  const setDefaultAddress = useMutation(api.addresses.setDefault);

  const addresses = addressBundle?.addresses ?? [];
  const defaultAddressId = addressBundle?.default_address_id ?? null;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [newAddress, setNewAddress] = useState<AddressFormState>(emptyAddress());
  const [creatingAddress, setCreatingAddress] = useState(false);

  const [editingId, setEditingId] = useState<AddressId | null>(null);
  const [editAddress, setEditAddress] = useState<AddressFormState>(emptyAddress());
  const [updatingAddress, setUpdatingAddress] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
  }, [profile]);

  const defaultAddress = useMemo(() => {
    if (!defaultAddressId) return null;
    const availableAddresses = addressBundle?.addresses ?? [];
    return availableAddresses.find((a: any) => a._id === defaultAddressId) ?? null;
  }, [addressBundle, defaultAddressId]);

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      await upsertProfile({
        full_name: fullName,
        phone,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1500);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreatingAddress(true);
    try {
      await createAddress({
        label: newAddress.label || undefined,
        recipient_name: newAddress.recipient_name || undefined,
        phone: newAddress.phone || undefined,
        line1: newAddress.line1,
        line2: newAddress.line2 || undefined,
        city: newAddress.city,
        state: newAddress.state || undefined,
        postal_code: newAddress.postal_code || undefined,
        country: newAddress.country,
        make_default: newAddress.make_default || undefined,
      });
      setNewAddress(emptyAddress());
    } finally {
      setCreatingAddress(false);
    }
  };

  const beginEdit = (address: any) => {
    setEditingId(address._id as AddressId);
    setEditAddress({
      label: address.label ?? '',
      recipient_name: address.recipient_name ?? '',
      phone: address.phone ?? '',
      line1: address.line1 ?? '',
      line2: address.line2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      postal_code: address.postal_code ?? '',
      country: address.country ?? 'Pakistan',
      make_default: defaultAddressId === address._id,
    });
  };

  const handleUpdateAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;
    setUpdatingAddress(true);
    try {
      await updateAddress({
        id: editingId,
        label: editAddress.label || undefined,
        recipient_name: editAddress.recipient_name || undefined,
        phone: editAddress.phone || undefined,
        line1: editAddress.line1,
        line2: editAddress.line2 || undefined,
        city: editAddress.city,
        state: editAddress.state || undefined,
        postal_code: editAddress.postal_code || undefined,
        country: editAddress.country,
        make_default: editAddress.make_default || undefined,
      } as any);
      setEditingId(null);
      setEditAddress(emptyAddress());
    } finally {
      setUpdatingAddress(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-10">
      <div className="space-y-2">
        <h2 className="font-display text-xl">Profile</h2>
        {user?.email ? (
          <p className="text-xs uppercase tracking-widest text-[#6E6E6E]">Signed in as {user.email}</p>
        ) : null}
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-4 text-sm bg-white border border-[#111]/10 p-5">
        <p className="label-text text-[#6E6E6E]">Account details</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit" disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
          {profileSaved ? (
            <span className="text-xs uppercase tracking-widest text-[#6E6E6E]">Saved</span>
          ) : null}
        </div>
      </form>

      <div className="space-y-4">
        <div>
          <h3 className="font-display text-lg">Saved Addresses</h3>
          <p className="text-xs text-[#6E6E6E]">
            Set a default shipping address to autofill checkout.
          </p>
        </div>

        {defaultAddress ? (
          <div className="border border-[#111]/10 bg-white p-5">
            <p className="label-text text-[#6E6E6E] mb-2">Default shipping</p>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {defaultAddress.label || 'Default address'}
                </p>
                {defaultAddress.recipient_name ? <p className="text-sm">{defaultAddress.recipient_name}</p> : null}
                {defaultAddress.phone ? <p className="text-sm">{defaultAddress.phone}</p> : null}
                {formatAddressLines(defaultAddress).map((line) => (
                  <p key={line} className="text-sm">
                    {line}
                  </p>
                ))}
              </div>
              <button
                type="button"
                className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
                onClick={() => beginEdit(defaultAddress)}
              >
                Edit
              </button>
            </div>
          </div>
        ) : null}

        {addresses.length === 0 ? (
          <p className="text-sm text-[#6E6E6E]">No saved addresses yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address: any) => {
              const isDefault = defaultAddressId === address._id;
              return (
                <div key={address._id} className="border border-[#111]/10 bg-white p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{address.label || 'Address'}</p>
                        {isDefault ? (
                          <span className="text-[10px] uppercase tracking-widest bg-[#111] text-white px-2 py-1">
                            Default
                          </span>
                        ) : null}
                      </div>
                      {address.recipient_name ? <p className="text-sm">{address.recipient_name}</p> : null}
                      {address.phone ? <p className="text-sm">{address.phone}</p> : null}
                      {formatAddressLines(address).map((line) => (
                        <p key={line} className="text-sm">
                          {line}
                        </p>
                      ))}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {!isDefault ? (
                        <button
                          type="button"
                          className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
                          onClick={() => setDefaultAddress({ id: address._id })}
                        >
                          Make default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
                        onClick={() => beginEdit(address)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs uppercase tracking-widest text-red-500/80 hover:text-red-600"
                        onClick={async () => {
                          const ok = window.confirm('Delete this address?');
                          if (!ok) return;
                          await removeAddress({ id: address._id });
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingId ? (
        <form onSubmit={handleUpdateAddress} className="space-y-4 text-sm bg-white border border-[#111]/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-text text-[#6E6E6E]">Edit address</p>
              <p className="text-xs text-[#6E6E6E]">Update address details and optionally set as default.</p>
            </div>
            <button
              type="button"
              className="text-xs uppercase tracking-widest text-[#6E6E6E] hover:text-[#111]"
              onClick={() => {
                setEditingId(null);
                setEditAddress(emptyAddress());
              }}
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={editAddress.label}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, label: e.target.value }))}
              placeholder="Label (Home/Office)"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
            <input
              value={editAddress.recipient_name}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, recipient_name: e.target.value }))}
              placeholder="Recipient name"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
            <input
              value={editAddress.phone}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone (optional)"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
          </div>

          <input
            value={editAddress.line1}
            onChange={(e) => setEditAddress((prev) => ({ ...prev, line1: e.target.value }))}
            placeholder="Address line 1"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <input
            value={editAddress.line2}
            onChange={(e) => setEditAddress((prev) => ({ ...prev, line2: e.target.value }))}
            placeholder="Address line 2"
            className="w-full border border-[#111]/10 px-3 py-2"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={editAddress.city}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="w-full border border-[#111]/10 px-3 py-2"
              required
            />
            <input
              value={editAddress.state}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="State"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={editAddress.postal_code}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, postal_code: e.target.value }))}
              placeholder="Postal code"
              className="w-full border border-[#111]/10 px-3 py-2"
            />
            <input
              value={editAddress.country}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, country: e.target.value }))}
              placeholder="Country"
              className="w-full border border-[#111]/10 px-3 py-2"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6E6E6E]">
            <input
              type="checkbox"
              checked={editAddress.make_default}
              onChange={(e) => setEditAddress((prev) => ({ ...prev, make_default: e.target.checked }))}
            />
            Set as default shipping address
          </label>

          <button className="btn-primary" type="submit" disabled={updatingAddress}>
            {updatingAddress ? 'Saving...' : 'Save Address'}
          </button>
        </form>
      ) : null}

      <form onSubmit={handleCreateAddress} className="space-y-4 text-sm bg-white border border-[#111]/10 p-5">
        <div>
          <p className="label-text text-[#6E6E6E]">Add a new address</p>
          <p className="text-xs text-[#6E6E6E]">Save multiple addresses and choose one as default.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={newAddress.label}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, label: e.target.value }))}
            placeholder="Label (Home/Office)"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <input
            value={newAddress.recipient_name}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, recipient_name: e.target.value }))}
            placeholder="Recipient name"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <input
            value={newAddress.phone}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone (optional)"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
        </div>

        <input
          value={newAddress.line1}
          onChange={(e) => setNewAddress((prev) => ({ ...prev, line1: e.target.value }))}
          placeholder="Address line 1"
          className="w-full border border-[#111]/10 px-3 py-2"
          required
        />
        <input
          value={newAddress.line2}
          onChange={(e) => setNewAddress((prev) => ({ ...prev, line2: e.target.value }))}
          placeholder="Address line 2"
          className="w-full border border-[#111]/10 px-3 py-2"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={newAddress.city}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="City"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
          <input
            value={newAddress.state}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, state: e.target.value }))}
            placeholder="State"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={newAddress.postal_code}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, postal_code: e.target.value }))}
            placeholder="Postal code"
            className="w-full border border-[#111]/10 px-3 py-2"
          />
          <input
            value={newAddress.country}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, country: e.target.value }))}
            placeholder="Country"
            className="w-full border border-[#111]/10 px-3 py-2"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#6E6E6E]">
          <input
            type="checkbox"
            checked={newAddress.make_default}
            onChange={(e) => setNewAddress((prev) => ({ ...prev, make_default: e.target.checked }))}
          />
          Set as default shipping address
        </label>

        <button className="btn-primary" type="submit" disabled={creatingAddress}>
          {creatingAddress ? 'Adding...' : 'Add Address'}
        </button>
      </form>
    </div>
  );
}
