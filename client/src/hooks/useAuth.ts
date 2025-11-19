import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

/**
 * Custom hook to fetch and manage authentication state.
 * 
 * IMPORTANT: This hook uses on401: "returnNull" to gracefully handle
 * unauthenticated users. When the backend returns 401, the query
 * returns null instead of throwing an error. This prevents infinite
 * refetch loops and page reloads during development.
 */
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    // Use custom queryFn that returns null on 401 instead of throwing
    // This prevents error states that could trigger re-renders or reloads
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
