export const imageService = {
  getAvatarUrl: (avatarPath, name = 'User') => {
    if (!avatarPath) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    }
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    return `https://res.cloudinary.com/${cloudName}/${avatarPath}`
  },
}