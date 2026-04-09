import React from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

interface DeviceToggleProps {
  currentWidth: string;
  onWidthChange: (width: string) => void;
}

const DeviceToggle: React.FC<DeviceToggleProps> = ({ currentWidth, onWidthChange }) => {
  const [inputValue, setInputValue] = React.useState(currentWidth);

  React.useEffect(() => {
    setInputValue(currentWidth);
  }, [currentWidth]);

  const devices = [
    { id: 'mobile', width: '375px', icon: <Smartphone size={14} />, label: 'MOBIL' },
    { id: 'tablet', width: '768px', icon: <Tablet size={14} />, label: 'PLATTA' },
    { id: 'desktop', width: '100%', icon: <Monitor size={14} />, label: 'DESKTOP' },
  ];

  const handleApplyWidth = () => {
    let val = inputValue.trim();
    if (!val) return;
    if (/^\d+$/.test(val)) val += 'px';
    onWidthChange(val);
  };

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

      <div className="width-input-wrapper">
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApplyWidth()}
          onBlur={handleApplyWidth}
          className="hacker-mini-input"
          placeholder="WIDTH"
        />
      </div>

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

        .width-input-wrapper {
          margin-left: 5px;
          height: 24px;
          display: flex;
          align-items: center;
        }

        .hacker-mini-input {
          background: #000;
          border: 1px solid var(--border-color);
          color: var(--accent-primary);
          font-family: var(--font-mono);
          font-size: 0.7rem;
          width: 50px;
          height: 24px;
          padding: 0 5px;
          text-align: center;
          transition: all 0.2s;
          outline: none;
        }

        .hacker-mini-input:focus {
          border-color: var(--accent-primary);
          box-shadow: 0 0 8px rgba(0, 255, 65, 0.3);
          width: 70px;
        }
      `}</style>
    </div>
  );
};

export default DeviceToggle;
