
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookHeart, Plus, Trash2, BookOpen, Pencil, X } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const MyCookbooks = () => {
  const { token } = useAuth();

  const [cookbooks, setCookbooks] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingCookbook, setEditingCookbook] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchCookbooks = async () => {
    try {
      setLoading(true);
      const response = await API.get('/cookbooks', authHeaders);
      setCookbooks(response.data.cookbooks || []);
    } catch (error) {
      setError(
        error.response?.data?.message || 'Unable to load cookbooks.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCookbooks();
  }, [token]);

  const handleCreateCookbook = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('Please enter a cookbook name.');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setMessage('');

      await API.post(
        '/cookbooks',
        { name, description },
        authHeaders
      );

      setName('');
      setDescription('');
      setMessage('Cookbook created successfully.');

      await fetchCookbooks();
    } catch (error) {
      setError(
        error.response?.data?.message || 'Unable to create cookbook.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCookbook = async (cookbookId) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this cookbook?'
    );

    if (!confirmed) return;

    try {
      setError('');
      await API.delete(`/cookbooks/${cookbookId}`, authHeaders);

      setCookbooks((previous) =>
        previous.filter((book) => book._id !== cookbookId)
      );

      setMessage('Cookbook deleted successfully.');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Unable to delete cookbook.'
      );
    }
  };

  const handleUpdateCookbook = async (event) => {
    event.preventDefault();

    if (!editName.trim()) {
      setError('Please enter a cookbook name.');
      return;
    }

    try {
      setUpdating(true);
      setError('');
      setMessage('');

      const response = await API.put(
        `/cookbooks/${editingCookbook._id}`,
        {
          name: editName,
          description: editDescription,
        },
        authHeaders
      );

      setCookbooks((previous) =>
        previous.map((book) =>
          book._id === editingCookbook._id
            ? { ...book, ...response.data.cookbook }
            : book
        )
      );

      setEditingCookbook(null);
      setEditName('');
      setEditDescription('');
      setMessage('Cookbook updated successfully.');
    } catch (error) {
      setError(
        error.response?.data?.message || 'Unable to update cookbook.'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <p className="recipes-status">Loading your cookbooks...</p>;
  }

  return (
    <main className="my-cookbooks-page">
      <header className="cookbooks-header">
        <BookHeart size={30} />
        <h1>My Cookbooks</h1>
        <p>Organize your favourite recipes into personal collections.</p>
      </header>

      <section className="recipe-details-section">
        <h2>
          <Plus size={22} />
          Create a New Cookbook
        </h2>

        <form onSubmit={handleCreateCookbook} className="cookbook-form">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Cookbook name"
            maxLength={60}
            required
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe your cookbook (optional)"
            maxLength={300}
            rows={3}
          />

          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create Cookbook'}
          </button>
        </form>
      </section>

      {error && <p className="recipes-error">{error}</p>}
      {message && <p>{message}</p>}

      <section className="recipe-details-section">
        <h2>
          <BookOpen size={22} />
          Your Collections ({cookbooks.length})
        </h2>

        {cookbooks.length === 0 ? (
          <p>You haven't created any cookbooks yet.</p>
        ) : (
          <div className="cookbooks-grid">
            {cookbooks.map((cookbook) => (
              <article className="cookbook-card" key={cookbook._id}>
                <h3>{cookbook.name}</h3>
                <p>{cookbook.description || 'No description added.'}</p>

                <p>
                  {cookbook.recipes?.length || 0} saved recipes
                </p>

                <div className="cookbook-card-actions">
                  <Link to={`/cookbooks/${cookbook._id}`}>
                    View Collection
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCookbook(cookbook);
                      setEditName(cookbook.name);
                      setEditDescription(cookbook.description || '');
                      setError('');
                      setMessage('');
                    }}
                  >
                    <Pencil size={17} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCookbook(cookbook._id)}
                    aria-label={`Delete ${cookbook.name}`}
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                </div>

                {editingCookbook?._id === cookbook._id && (
                  <form
                    onSubmit={handleUpdateCookbook}
                    className="cookbook-form"
                  >
                    <h3>Edit Cookbook</h3>

                    <input
                      type="text"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      placeholder="Cookbook name"
                      maxLength={60}
                      required
                    />

                    <textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      placeholder="Cookbook description"
                      maxLength={300}
                      rows={3}
                    />

                    <button type="submit" disabled={updating}>
                      {updating ? 'Updating...' : 'Save Changes'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCookbook(null);
                        setEditName('');
                        setEditDescription('');
                        setError('');
                      }}
                    >
                      <X size={17} />
                      Cancel
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MyCookbooks;
