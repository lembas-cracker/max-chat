import { useState, type SubmitEvent } from "react";
import type { Credentials } from "../api/greenApi";

interface SetupScreenProps {
  onConnect: (credentials: Credentials) => void;
}

const SetupScreen = ({ onConnect }: SetupScreenProps) => {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!idInstance || !apiTokenInstance) {
      return;
    }

    onConnect({ idInstance, apiTokenInstance });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Connect to MAX</h1>

        <input
          className="w-full border p-2 mb-3 rounded"
          placeholder="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
        />
        <input
          type="password"
          className="w-full border p-2 mb-3 rounded"
          placeholder="apiTokenInstance"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Connect</button>
      </form>
    </div>
  );
};

export default SetupScreen;
