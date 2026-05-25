import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { api } from '../../../../Backend/convex/_generated/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, isLoading: isLoadingConvex } = useConvexAuth();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();

  // Mapped user object to match previous interface if needed
  const user = clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    ...clerkUser
  } : null;

  // Show blocking loader until both Clerk and Convex have finished determining the auth state.
  const isLoadingAuth = isLoadingConvex || !isClerkLoaded;
  // Previously used for checking app settings, now assumed true/loaded
  const isLoadingPublicSettings = false;
  const [authError, setAuthError] = useState(null);

  // Sync user to Convex
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isAuthenticated && clerkUser) {
      // Sync user logic
      const sync = async () => {
        try {
          await storeUser();
        } catch (err) {
          console.error("Failed to sync user:", err);
        }
      };
      sync();
    }
  }, [isAuthenticated, clerkUser, storeUser]);

  // OWASP: Check if user is blocked
  const convexUser = useQuery(
    api.users.getByEmail,
    isAuthenticated && user?.email ? { email: user.email } : "skip"
  );

  useEffect(() => {
    if (convexUser && convexUser.blocked) {
      setAuthError({
        type: 'user_blocked',
        message: convexUser.blocked_reason || "Your account has been blocked by an administrator. Contact support@kranely.com for assistance."
      });
    } else if (convexUser && !convexUser.blocked && authError?.type === 'user_blocked') {
      setAuthError(null);
    }
  }, [convexUser]);

  const navigateToLogin = () => openSignIn();
  const logout = () => signOut();

  const checkAppState = async () => {
    // No-op in new auth flow
  };

  // User is pending activation if they are authenticated but have no role assigned
  const isPendingActivation = isAuthenticated && convexUser !== undefined && convexUser !== null && !convexUser.role;

  return (
    <AuthContext.Provider value={{
      user,
      convexUser,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      isPendingActivation,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
