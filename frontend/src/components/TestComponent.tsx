import React from 'react';

const TestComponent: React.FC = () => {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Kryvex Trading Platform</h1>
      <p className="text-muted-foreground mb-4">
        Welcome to the trading platform
      </p>
      <div className="space-y-2">
        <div className="p-4 bg-card rounded-lg">
          <h2 className="font-semibold">Status</h2>
          <p className="text-sm text-muted-foreground">Application is running</p>
        </div>
        <div className="p-4 bg-card rounded-lg">
          <h2 className="font-semibold">Features</h2>
          <ul className="text-sm text-muted-foreground text-left">
            <li>✅ Authentication</li>
            <li>✅ Trading Interface</li>
            <li>✅ Wallet Management</li>
            <li>✅ KYC Verification</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
