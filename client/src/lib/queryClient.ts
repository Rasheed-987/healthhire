import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// CSRF token management
let cachedCSRFToken: string | null = null;

async function getCSRFToken(): Promise<string> {
  if (!cachedCSRFToken) {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    const data = await response.json();
    cachedCSRFToken = data.csrfToken;
  }
  return cachedCSRFToken;
}

function clearCSRFToken() {
  cachedCSRFToken = null;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle FormData differently - don't set Content-Type header (let browser set it with boundary)
  const isFormData = data instanceof FormData;
  const headers: Record<string, string> = (data && !isFormData) ? { "Content-Type": "application/json" } : {};
  
  // Add CSRF token for state-changing requests
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (stateChangingMethods.includes(method.toUpperCase())) {
    try {
      const csrfToken = await getCSRFToken();
      headers['x-csrf-token'] = csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      // Continue without CSRF token - let the server handle the error
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
    credentials: "include",
  });

  // If CSRF token is invalid, clear cache and retry once
  if (res.status === 403 && stateChangingMethods.includes(method.toUpperCase())) {
    const errorText = await res.text();
    if (errorText.includes('CSRF')) {
      clearCSRFToken();
      
      // Retry with fresh token
      const newToken = await getCSRFToken();
      headers['x-csrf-token'] = newToken;
      
      const retryRes = await fetch(url, {
        method,
        headers,
        body: data ? (isFormData ? data : JSON.stringify(data)) : undefined,
        credentials: "include",
      });
      
      await throwIfResNotOk(retryRes);
      return retryRes;
    }
    
    // Re-throw the original error if not CSRF related
    throw new Error(`${res.status}: ${errorText}`);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const headers: Record<string, string> = {};
    
    // Add CSRF token for admin endpoints (even GET requests)
    if (url.includes('/api/admin/')) {
      try {
        const csrfToken = await getCSRFToken();
        headers['x-csrf-token'] = csrfToken;
      } catch (error) {
        console.error('Failed to get CSRF token for admin request:', error);
        // Continue without CSRF token - let the server handle the error
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    // Handle CSRF token errors for admin endpoints
    if (res.status === 403 && url.includes('/api/admin/')) {
      const errorText = await res.text();
      if (errorText.includes('CSRF')) {
        clearCSRFToken();
        
        // Retry with fresh token
        try {
          const newToken = await getCSRFToken();
          const retryRes = await fetch(url, {
            credentials: "include",
            headers: {
              'x-csrf-token': newToken,
            },
          });
          
          if (unauthorizedBehavior === "returnNull" && retryRes.status === 401) {
            return null;
          }
          
          await throwIfResNotOk(retryRes);
          return await retryRes.json();
        } catch (retryError) {
          // Re-throw the original error if retry fails
          throw new Error(`${res.status}: ${errorText}`);
        }
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
