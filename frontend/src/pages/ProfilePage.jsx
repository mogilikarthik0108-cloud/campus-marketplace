import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  MapPin, 
  School, 
  Phone, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Package,
  ShoppingBag,
  Star
} from 'lucide-react';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userService.getProfile();
        if (res.data.success) {
          const u = res.data.user;
          setProfileData(u);
          setFullName(u.full_name);
          setCollegeName(u.college_name);
          setCampusLocation(u.campus_location);
          setPhoneNumber(u.phone_number || '');
          setBio(u.bio || '');
          setAvatarUrl(u.avatar_url || '');
        }
      } catch (err) {
        console.error('Fetch profile error:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      setSavingProfile(true);
      const res = await userService.updateProfile({
        full_name: fullName,
        college_name: collegeName,
        campus_location: campusLocation,
        phone_number: phoneNumber,
        bio,
        avatar_url: avatarUrl
      });

      if (res.data.success) {
        setProfileSuccess('Profile updated successfully.');
        updateUser(res.data.user);
        setTimeout(() => setProfileSuccess(''), 3000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await userService.changePassword({
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        setPasswordSuccess('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Error changing password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Stats */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <img
          src={avatarUrl || user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'User')}&background=0f172a&color=fff`}
          alt={fullName}
          className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-sm"
        />
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl font-bold text-slate-900">{fullName || user?.full_name}</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-800 rounded-full uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500">{user?.email}</p>
          <p className="text-xs text-slate-600 font-medium">
            {collegeName || user?.college_name} &bull; <span className="text-teal-700">{campusLocation || user?.campus_location}</span>
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
          <div>
            <span className="text-lg font-bold text-slate-900">{profileData?.listingsCount || 0}</span>
            <span className="text-[10px] text-slate-400 block">Listings</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <span className="text-lg font-bold text-slate-900">{profileData?.ordersCount || 0}</span>
            <span className="text-[10px] text-slate-400 block">Orders</span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div>
            <div className="flex items-center text-amber-500 justify-center">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-900 ml-1">{profileData?.ratingAvg || '5.0'}</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Rating</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Update Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Edit Profile Information
          </h2>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College / University Name</label>
              <input
                type="text"
                required
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Campus / Location</label>
              <input
                type="text"
                required
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (Optional)</label>
              <input
                type="text"
                placeholder="+91..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bio / Student Intro</label>
              <textarea
                rows="2"
                placeholder="Year, branch, what you frequently buy or sell..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 h-fit">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Change Password
          </h2>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength="6"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength="6"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
