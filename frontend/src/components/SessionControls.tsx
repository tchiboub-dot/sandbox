import { useState } from 'react';
import { Phone, MessageSquare, MapPin, RotateCw, Keyboard } from 'lucide-react';
import { apiClient } from '../services/api';

interface SessionControlsProps {
  sessionId: string;
}

export default function SessionControls({ sessionId }: SessionControlsProps) {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsText, setSmsText] = useState('');

  const handleSimulateCall = async () => {
    if (!phoneNumber) {
      alert('Please enter a phone number');
      return;
    }
    try {
      await apiClient.simulatePhoneAction(sessionId, 'call', { phoneNumber });
      setPhoneNumber('');
    } catch (error) {
      console.error('Failed to simulate call:', error);
    }
  };

  const handleSimulateSMS = async () => {
    if (!phoneNumber || !smsText) {
      alert('Please enter phone number and message');
      return;
    }
    try {
      await apiClient.simulatePhoneAction(sessionId, 'sms', { phoneNumber, message: smsText });
      setPhoneNumber('');
      setSmsText('');
    } catch (error) {
      console.error('Failed to simulate SMS:', error);
    }
  };

  const handleSetLocation = async () => {
    const lat = prompt('Enter latitude (e.g., 37.7749):');
    const lng = prompt('Enter longitude (e.g., -122.4194):');
    if (lat && lng) {
      try {
        await apiClient.setLocation(sessionId, parseFloat(lat), parseFloat(lng));
      } catch (error) {
        console.error('Failed to set location:', error);
      }
    }
  };

  const handleRotate = async () => {
    try {
      await apiClient.rotateScreen(sessionId);
    } catch (error) {
      console.error('Failed to rotate screen:', error);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Phone Call */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="px-3 py-2 bg-gray-700 rounded text-sm text-white w-32"
          />
          <button
            onClick={handleSimulateCall}
            className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
            title="Simulate Call"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>

        {/* SMS */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="SMS text"
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            className="px-3 py-2 bg-gray-700 rounded text-sm text-white w-32"
          />
          <button
            onClick={handleSimulateSMS}
            className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            title="Simulate SMS"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Location */}
        <button
          onClick={handleSetLocation}
          className="p-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
          title="Set Location"
        >
          <MapPin className="w-5 h-5" />
        </button>

        {/* Rotate */}
        <button
          onClick={handleRotate}
          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
          title="Rotate Screen"
        >
          <RotateCw className="w-5 h-5" />
        </button>

        {/* Virtual Keyboard */}
        <button
          onClick={() => setShowKeyboard(!showKeyboard)}
          className={`p-2 rounded transition-colors ${
            showKeyboard ? 'bg-primary-600' : 'bg-gray-600 hover:bg-gray-500'
          }`}
          title="Toggle Virtual Keyboard"
        >
          <Keyboard className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
