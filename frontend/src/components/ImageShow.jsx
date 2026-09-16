import { Image } from 'react-bootstrap';
import { imageService } from '../services/imageService';

export default function ImageShow({
  src,
  name = 'User',
  shape = 'circle',
  size = 35,
  width,
  height,
  className = ''
}) {
  const avatarUrl = imageService.getAvatarUrl(src, name);
  const shapeClass = shape === 'circle' ? 'rounded-circle' : shape === 'rounded' ? 'rounded-3' : '';

  return (
    <Image
      src={avatarUrl}
      alt={name}
      width={width || size}
      height={height || size}
      className={`object-fit-cover border ${shapeClass} ${className}`}
    />
  );
}