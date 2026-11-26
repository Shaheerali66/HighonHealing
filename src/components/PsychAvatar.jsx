export const getCleanInitial = (name = '') => {
  if (!name) return '?';
  let clean = name.trim();
  const prefixRegex = /^(Prof\.|Dr\.|Ms\.|Mr\.|Mrs\.|Squadron Leader)\s+/i;
  while (prefixRegex.test(clean)) {
    clean = clean.replace(prefixRegex, '').trim();
  }
  return clean.charAt(0).toUpperCase() || name.charAt(0).toUpperCase();
};

const PsychAvatar = ({ name = '', image = '', size = 52, className = '' }) => {
  const initial = getCleanInitial(name);
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const fontSize = typeof size === 'number' ? `${Math.round(size * 0.42)}px` : '1.3rem';

  return (
    <div
      className={`psych-avatar ${className}`.trim()}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        minHeight: dimension,
        borderRadius: '50%',
        background: 'var(--gradient-cta)',
        color: '#ffffff',
        fontFamily: "'Outfit', sans-serif",
        fontSize: fontSize,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        flexShrink: 0,
      }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
            display: 'block',
          }}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

export default PsychAvatar;
