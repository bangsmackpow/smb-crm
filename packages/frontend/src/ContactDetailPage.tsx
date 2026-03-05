import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, Contact, Communication } from '../api.ts';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [error, setError] = useState('');
  const [showCommunicationForm, setShowCommunicationForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadContact(id);
      loadCommunications(id);
    }
  }, [id]);

  const loadContact = async (contactId: string) => {
    try {
      const response = await api.getContact(contactId);
      setContact(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    }
  };

  const loadCommunications = async (contactId: string) => {
    try {
      const response = await api.getCommunications({ contactId });
      setCommunications(response.data.items);
    } catch (err) {
      console.error('Failed to load communications:', err);
    }
  };

  const handleCommunicationAdded = () => {
    if (id) {
      loadCommunications(id);
    }
    setShowCommunicationForm(false);
  };

  if (error || !contact) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Contact not found'}
      </div>
    );
  }

  return (
    <div>
      {/* Contact Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xl font-medium text-gray-700">
                    {contact.first_name[0]}
                    {contact.last_name[0]}
                  </span>
                </div>
              </div>
              <div className="ml-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  {contact.first_name} {contact.last_name}
                </h1>
                <p className="text-sm text-gray-500">{contact.email}</p>
                {contact.company && (
                  <p className="text-sm text-gray-600">
                    {contact.job_title} at {contact.company}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  contact.status === 'customer'
                    ? 'bg-green-100 text-green-800'
                    : contact.status === 'prospect'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {contact.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Details */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Details</h3>
              <dl className="space-y-3">
                {contact.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{contact.phone}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900 capitalize">{contact.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Communications */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Communications</h3>
                <button
                  onClick={() => setShowCommunicationForm(true)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                >
                  Log Communication
                </button>
              </div>

              {/* Communication Form */}
              {showCommunicationForm && (
                <div className="mb-6 p-4 border border-gray-200 rounded-md">
                  <CommunicationForm
                    contactId={contact.id}
                    onSuccess={handleCommunicationAdded}
                    onCancel={() => setShowCommunicationForm(false)}
                  />
                </div>
              )}

              {/* Communications List */}
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {comm.type}
                          </span>
                          {comm.direction && (
                            <span className="text-xs text-gray-500 capitalize">
                              ({comm.direction})
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              comm.status === 'sent'
                                ? 'bg-green-100 text-green-800'
                                : comm.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {comm.status}
                          </span>
                        </div>
                        {comm.subject && (
                          <p className="text-sm font-medium text-gray-900 mt-1">{comm.subject}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">{comm.content}</p>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(comm.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {communications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No communications yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommunicationFormProps {
  contactId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function CommunicationForm({ contactId, onSuccess, onCancel }: CommunicationFormProps) {
  const [type, setType] = useState('email');
  const [direction, setDirection] = useState('outbound');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createCommunication({
        contact_id: contactId,
        type,
        direction,
        subject: subject || undefined,
        content,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to create communication:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="sms">SMS</option>
              <option value="meeting">Meeting</option>
              <option value="note">Note</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="internal">Internal</option>
            </select>
          </div>
        </div>

        {(type === 'email' || type === 'meeting') && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the communication content..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Communication'}
          </button>
        </div>
      </div>
    </form>
  );
}
