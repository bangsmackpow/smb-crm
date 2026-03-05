import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Contact } from './api';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await api.getContacts();
      setContacts(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <Link
          to="/contacts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Contact
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {contacts.map((contact) => (
            <li key={contact.id}>
              <Link to={`/contacts/${contact.id}`} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {contact.first_name[0]}
                            {contact.last_name[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
                  {contact.company && (
                    <div className="mt-2 text-sm text-gray-600">
                      {contact.company}
                      {contact.job_title && ` • ${contact.job_title}`}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No contacts yet.</p>
            <Link
              to="/contacts/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
            >
              Add your first contact
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
