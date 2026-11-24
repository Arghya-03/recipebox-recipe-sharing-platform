
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UserRound,
  Users,
  ChefHat,
  UserPlus,
  UserMinus,
  X,
} from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Controls the Followers / Following popup
  const [activeList, setActiveList] = useState(null);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await API.get(`/social/profile/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const fetchedProfile = response.data.user;

        setProfile(fetchedProfile);
        setRecipes(response.data.recipes || []);

        setIsFollowing(
          fetchedProfile.followers?.some(
            (follower) =>
              (follower?._id || follower)?.toString() ===
              user?._id?.toString()
          ) || false
        );
      } catch (error) {
        console.error('Profile fetching error:', error);
        setError(
          error.response?.data?.message ||
          'Unable to load user profile.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token && userId) {
      fetchProfile();
    }
  }, [userId, token, user?._id]);

  const handleFollowToggle = async () => {
    try {
      setActionLoading(true);

      if (isFollowing) {
        await API.delete(`/social/unfollow/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsFollowing(false);

        setProfile((previous) => ({
          ...previous,
          followers: previous.followers.filter(
            (follower) =>
              (follower?._id || follower).toString() !==
              user._id.toString()
          ),
        }));
      } else {
        await API.post(
          `/social/follow/${userId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setIsFollowing(true);

        setProfile((previous) => ({
          ...previous,
          followers: [
            ...previous.followers,
            {
              _id: user._id,
              name: user.name,
              profileImage: user.profileImage || '',
            },
          ],
        }));
      }
    } catch (error) {
      console.error('Follow action error:', error);
      setError(
        error.response?.data?.message ||
        'Unable to update follow status.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openUserList = (listType) => {
    setActiveList(listType);
  };

  const closeUserList = () => {
    setActiveList(null);
  };

  if (loading) {
    return <p className="recipes-status">Loading profile...</p>;
  }

  if (error && !profile) {
    return (
      <p className="recipes-status recipes-error">
        {error}
      </p>
    );
  }

  if (!profile) return null;

  const isOwnProfile = user?._id === profile._id;

  const selectedUsers =
    activeList === 'followers'
      ? profile.followers || []
      : activeList === 'following'
        ? profile.following || []
        : [];

  return (
    <main className="user-profile-page">
      <section className="user-profile-header">
        <div className="user-profile-avatar">
          {profile.profileImage ? (
            <button
              type="button"
              className="profile-photo-trigger"
              onClick={() => setIsPhotoViewerOpen(true)}
              aria-label="View profile picture"
            >
              <img src={profile.profileImage} alt={profile.name} />
            </button>
          ) : (
            <UserRound size={55} />
          )}
        </div>

        <div className="user-profile-info">
          <h1>{profile.name}</h1>
          <p>{profile.bio || 'Food lover and recipe creator.'}</p>

          <div className="user-profile-stats">
            <button
              type="button"
              className="profile-stat-button"
              onClick={() => openUserList('recipes')}
            >
              <ChefHat size={18} />
              <strong>{recipes.length}</strong>
              Recipes
            </button>

            <button
              type="button"
              className="profile-stat-button"
              onClick={() => openUserList('followers')}
            >
              <Users size={18} />
              <strong>{profile.followers.length}</strong>
              Followers
            </button>

            <button
              type="button"
              className="profile-stat-button"
              onClick={() => openUserList('following')}
            >
              <Users size={18} />
              <strong>{profile.following.length}</strong>
              Following
            </button>
          </div>

          {isOwnProfile ? (
            <button
              type="button"
              className="profile-follow-button"
              onClick={() => navigate('/edit-profile')}
            >
              <UserRound size={18} />
              Edit Profile
            </button>
          ) : (
            <button
              type="button"
              className="profile-follow-button"
              onClick={handleFollowToggle}
              disabled={actionLoading}
            >
              {isFollowing ? (
                <>
                  <UserMinus size={18} />
                  {actionLoading ? 'Please wait...' : 'Unfollow'}
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  {actionLoading ? 'Please wait...' : 'Follow'}
                </>
              )}
            </button>
          )}

          {error && (
            <p className="recipes-error">{error}</p>
          )}
        </div>
      </section>

      <section className="user-profile-recipes">
        <h2>Recipes by {profile.name}</h2>

        {recipes.length === 0 ? (
          <p className="recipes-status">
            This cook hasn't shared any recipes yet.
          </p>
        ) : (
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
              />
            ))}
          </div>
        )}
      </section>

      {/* Instagram-style Followers / Following popup */}
      {activeList && (
        <div
          className="profile-modal-overlay"
          onClick={closeUserList}
        >
          <div
            className="profile-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h2 id="profile-modal-title">
                {activeList === 'followers'
                  ? 'Followers'
                  : activeList === 'following'
                    ? 'Following'
                    : 'Recipes'}
              </h2>

              <button
                type="button"
                className="profile-modal-close"
                onClick={closeUserList}
                aria-label="Close popup"
              >
                <X size={22} />
              </button>
            </div>

            <div className="profile-modal-user-list">
              {activeList === 'recipes' ? (
                recipes.length === 0 ? (
                  <p className="profile-modal-empty">
                    This user hasn't published any recipes yet.
                  </p>
                ) : (
                  <div className="profile-modal-recipes-grid">
                    {recipes.map((recipe) => (
                      <RecipeCard
                        key={recipe._id}
                        recipe={recipe}
                      />
                    ))}
                  </div>
                )
              ) : (
                selectedUsers.length === 0 ? (
                  <p className="profile-modal-empty">
                    {activeList === 'followers'
                      ? 'No followers yet.'
                      : 'Not following anyone yet.'}
                  </p>
                ) : (
                  selectedUsers.map((person) => (
                    <Link
                      key={person._id}
                      to={`/profile/${person._id}`}
                      className="profile-modal-user"
                      onClick={closeUserList}
                    >
                      <div className="profile-modal-avatar">
                        {person.profileImage ? (
                          <img
                            src={person.profileImage}
                            alt={person.name}
                          />
                        ) : (
                          <UserRound size={24} />
                        )}
                      </div>

                      <span>{person.name}</span>
                    </Link>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
      {/* Instagram-style profile photo viewer */}
      {isPhotoViewerOpen && profile.profileImage && (
        <div
          className="profile-photo-overlay"
          onClick={() => setIsPhotoViewerOpen(false)}
        >
          <button
            type="button"
            className="profile-photo-close"
            onClick={() => setIsPhotoViewerOpen(false)}
            aria-label="Close photo viewer"
          >
            <X size={26} />
          </button>

          <img
            src={profile.profileImage}
            alt={`${profile.name}'s profile picture`}
            className="profile-photo-enlarged"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
};

export default UserProfile;
