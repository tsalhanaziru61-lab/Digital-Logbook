/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserRole } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { AccessDenied } from './AccessDenied';

interface RoleRouteProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onNavigateHome?: () => void;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  children,
  fallback,
  onNavigateHome,
}) => {
  const { role } = useAuth();

  return (
    <ProtectedRoute fallback={fallback}>
      {role && allowedRoles.includes(role) ? (
        <>{children}</>
      ) : (
        <AccessDenied
          requiredRole={allowedRoles}
          onNavigateHome={onNavigateHome}
        />
      )}
    </ProtectedRoute>
  );
};
