/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from 'react';
import { AuthContextType } from '../types/auth';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
