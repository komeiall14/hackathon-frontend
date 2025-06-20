import React from 'react';

interface InitialAvatarProps {
  name: string;
  size: number;
}

const nameToColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ];
  const index = Math.abs(hash % colors.length);
  return colors[index];
};

export const InitialAvatar: React.FC<InitialAvatarProps> = ({ name, size }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const avatarStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: `${size}px`, height: `${size}px`, borderRadius: '50%',
    backgroundColor: nameToColor(name), color: 'white',
    fontSize: `${size * 0.5}px`, fontWeight: 'bold',
  };
  return <div style={avatarStyle}>{initial}</div>;
};