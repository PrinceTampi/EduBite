// This file is intentionally empty. The explore tab has been replaced by the AI Tutor.
// Keeping this file avoids router errors if it's referenced anywhere.
import { Redirect } from 'expo-router';
export default function ExploreRedirect() {
  return <Redirect href="/(tabs)/tutor" />;
}
