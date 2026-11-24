
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, UserRound, Save, X } from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditProfile = () => {
    const { user, token, updateUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(user?.profileImage || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleImageChange = (event) => {
        const selectedImage = event.target.files?.[0];

        if (!selectedImage) return;

        if (!selectedImage.type.startsWith('image/')) {
            setError('Please select a valid image.');
            return;
        }

        if (selectedImage.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5 MB.');
            return;
        }

        setError('');
        setImage(selectedImage);
        setPreview(URL.createObjectURL(selectedImage));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const headers = {
                Authorization: `Bearer ${token}`,
            };

            // Update name and bio
            const response = await API.put(
                '/auth/me',
                { name, bio },
                { headers }
            );

            let updatedUser = {
                ...user,
                ...response.data.user,
            };

            // Upload profile picture if selected
            if (image) {
                const formData = new FormData();
                formData.append('image', image);

                const uploadResponse = await API.post(
                    '/uploads/profile',
                    formData,
                    { headers }
                );

                updatedUser = {
                    ...updatedUser,
                    ...uploadResponse.data.user,
                };
            }

            updateUser(updatedUser);
            setSuccess('Profile updated successfully!');

            setTimeout(() => {
                navigate(`/profile/${updatedUser._id}`);
            }, 800);

        } catch (err) {
            console.error('Profile update error:', err);

            setError(
                err.response?.data?.message ||
                'Unable to update profile. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="edit-profile-page">
            <section className="edit-profile-card">
                <div className="edit-profile-heading">
                    <h1>Edit Your Profile</h1>
                    <p>Update your personal information and profile photo.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="edit-profile-image-section">
                        <div className="edit-profile-avatar">
                            {preview ? (
                                <img src={preview} alt="Profile preview" />
                            ) : (
                                <UserRound size={55} />
                            )}
                        </div>

                        <label className="profile-image-upload">
                            <Camera size={17} />
                            Change Profile Photo

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </label>

                        <span>Maximum image size: 5 MB</span>
                    </div>

                    <div className="edit-profile-field">
                        <label htmlFor="profile-name">Full Name</label>
                        <input
                            id="profile-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={60}
                            required
                        />
                    </div>

                    <div className="edit-profile-field">
                        <label htmlFor="profile-bio">About You</label>
                        <textarea
                            id="profile-bio"
                            value={bio}
                            onChange={(event) => setBio(event.target.value)}
                            maxLength={300}
                            rows={4}
                            placeholder="Tell others about yourself..."
                        />
                        <span>{bio.length}/300 characters</span>
                    </div>

                    {error && (
                        <p className="edit-profile-message error">{error}</p>
                    )}

                    {success && (
                        <p className="edit-profile-message success">{success}</p>
                    )}

                    <div className="edit-profile-actions">
                        <button
                            type="button"
                            className="edit-profile-cancel"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            <X size={17} />
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="edit-profile-save"
                            disabled={loading}
                        >
                            <Save size={17} />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
};

export default EditProfile;
