import React from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface DeviceToggleProps {
  currentWidth: string;
  onWidthChange: (width: string) => void;
}

const DeviceToggle: React.FC<DeviceToggleProps> = ({ currentWidth, onWidthChange }) => {
  const devices = [
    { id: 'mobile', width: '375px', icon: <Smartphone size={14} />, label: 'MOBIL' },
    { id: 'tablet', width: '768px', icon: <Tablet size={14} />, label: 'PLATTA' },
    { id: 'desktop', width: '100%', icon: <Monitor size={14} />, label: 'DESKTOP' },
  ];

  return (
    <div className="device-toggle">
      {devices.map((device) => (
        <button
          key={device.id}
          className={`pane-button ${currentWidth === device.width ? 'active' : ''}`}
          onClick={() => onWidthChange(device.width)}
          title={`Visa som ${device.label}`}
        >
          {device.icon}
          <span className="device-label">{device.label}</span>
        </button>
      ))}

      <style>{`
        .device-toggle {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        
        @media (max-width: 600px) {
          .device-label {
            display: none;
          }
        }

        .device-toggle .pane-button {
          display: flex;
          align-items: center;
          gap: 5px;
          height: 24px;
        }
      `}</style>
    </div>
  );
};

export default DeviceToggle;
