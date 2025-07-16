import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signIn, signOut } from 'next-auth/react';

interface SignupData {
  username: string;
  password: string;
  name: string;
  email: string;
  phone?: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface SignupResponse {
  user: {
    id: string;
    username: string;
    name: string;
    email: string;
    role: string;
  };
}

// Hook for user registration
export function useSignup() {
  return useMutation<SignupResponse, Error, SignupData>({
    mutationFn: async (signupData) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }

      return response.json();
    },
  });
}

// Hook for user login
export function useLogin() {
  return useMutation<any, Error, LoginData>({
    mutationFn: async (loginData) => {
      const result = await signIn('credentials', {
        username: loginData.username,
        password: loginData.password,
        redirect: false,
      });

      if (!result?.ok) {
        throw new Error('Invalid username or password');
      }

      return result;
    },
  });
}

// Hook for user logout
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      // Clear all queries when user logs out
      queryClient.clear();
    },
  });
}