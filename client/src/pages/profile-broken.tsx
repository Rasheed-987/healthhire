import { useEffect } from "react";
import { useLocation } from "wouter";

// This page was a broken copy and caused TypeScript to fail. Redirect
// users to the working profile page.
export default function ProfileBrokenRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/profile");
  }, [setLocation]);

  return null;
}
