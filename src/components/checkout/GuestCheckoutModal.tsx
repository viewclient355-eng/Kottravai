import React, { useState } from 'react';
import { useGuestAuth } from '../../contexts/GuestAuthContext';

export const GuestCheckoutModal = ({ isOpen, onClose }) => {
  const { sendOTP, verifyOTP } = useGuestAuth();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await sendOTP(phone);
      if (success) setStep(2);
    } catch (e) {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const success = await verifyOTP(phone, otp);
      if (success) onClose();
      else setError('Invalid OTP.');
    } catch (e) {
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Guest Checkout</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {step === 1 ? (
          <div>
            <label className="block text-sm font-medium mb-2">Mobile Number</label>
            <input 
              type="tel" 
              className="w-full border p-2 rounded mb-4" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="+91 99999 99999"
            />
            <button 
              onClick={handleSendOTP} 
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">Enter OTP sent to {phone}</label>
            <input 
              type="text" 
              maxLength={6}
              className="w-full border p-2 rounded mb-4 text-center tracking-widest text-lg" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
            />
            <button 
              onClick={handleVerify} 
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
