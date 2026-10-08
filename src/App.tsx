import { useState } from "react";
import SetupScreen from "./components/SetupScreen";
import Chat from "./components/Chat";
import { Credentials } from "./api/greenApi";

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  if (!credentials) {
    return <SetupScreen onConnect={setCredentials} />;
  }

  return <Chat credentials={credentials} />;
}
