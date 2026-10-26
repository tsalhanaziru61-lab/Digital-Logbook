/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  return (
    <div className="py-8">
      <LoginForm onSuccess={onSuccess} />
    </div>
  );
};
