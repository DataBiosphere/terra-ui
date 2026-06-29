import { Icon, TooltipTrigger } from '@terra-ui-packages/components';
import React, { useState } from 'react';
import colors from 'src/libs/colors';

interface PurchaseOptionCardProps {
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
  isSelected: boolean;
  disabled?: boolean;
}

export const PurchaseOptionCard: React.FC<PurchaseOptionCardProps> = ({
  title,
  description,
  buttonText,
  onClick,
  isSelected,
  disabled = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  let borderColor = 'transparent';
  if (!disabled && (isSelected || isHovered)) {
    borderColor = '#074770';
  }

  const getBackgroundColor = () => {
    if (disabled) return '#f0f0f0';
    if (isSelected) return '#e3f1fc';
    return '#f4f6f9';
  };

  const getButtonBackgroundColor = () => {
    if (disabled) return colors.dark(0.25);
    if (isSelected) return '#5CC88D';
    return '#074770';
  };

  const cardContent = (
    <button
      type='button'
      disabled={disabled}
      style={{
        flex: 1,
        backgroundColor: getBackgroundColor(),
        borderRadius: '8px',
        padding: '1.5rem',
        border: `2px solid ${borderColor}`,
        transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        opacity: disabled ? 0.9 : 1,
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onClick={disabled ? undefined : onClick}
    >
      <div
        style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '0.75rem',
          color: disabled ? colors.dark(0.5) : '#333F52',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isSelected && !disabled && <Icon icon='check' size={20} style={{ color: '#5CC88D', marginRight: '0.5rem' }} />}
        {title}
      </div>
      <div
        style={{
          fontSize: '14px',
          color: disabled ? colors.dark(0.5) : colors.dark(0.7),
          marginBottom: '1.5rem',
          flex: 1,
        }}
      >
        {description}
      </div>
      <div
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
          backgroundColor: getButtonBackgroundColor(),
          borderRadius: '4px',
          color: disabled ? colors.dark(0.5) : 'white',
          fontWeight: 500,
          textAlign: 'center',
          fontSize: '14px',
        }}
      >
        {buttonText}
      </div>
    </button>
  );

  if (disabled) {
    return (
      <div style={{ flex: 1 }}>
        <TooltipTrigger content='This option is currently unavailable for this pipeline' side='bottom'>
          <div style={{ width: '100%' }}>{cardContent}</div>
        </TooltipTrigger>
      </div>
    );
  }

  return cardContent;
};
