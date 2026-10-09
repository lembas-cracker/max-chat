import { useState, type SubmitEvent } from "react";
import type { Credentials } from "../api/greenApi";
import { MessageCircle, Hash, KeyRound, ArrowRight } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-max-bg px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-max-accent/15 ring-1 ring-max-accent/30">
            <MessageCircle className="h-7 w-7 text-max-accent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-max-text">Connect to MAX</h1>
          <p className="mt-1 text-sm text-max-text-dim">Введите ID и API токен, чтобы продолжить</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-max-border bg-max-panel p-6 shadow-xl">
          <label className="mb-4 block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-max-text-dim">
              ID Instance
            </span>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-max-text-dim" />
              <input
                className="w-full rounded-lg border border-max-border bg-max-panel-2 py-2.5 pl-10 pr-3 text-sm text-max-text placeholder:text-max-text-dim/60 outline-none transition focus:border-max-accent focus:ring-2 focus:ring-max-accent/25"
                placeholder="1101000000"
                value={idInstance}
                onChange={(e) => setIdInstance(e.target.value)}
              />
            </div>
          </label>

          <label className="mb-6 block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-max-text-dim">
              API Token
            </span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-max-text-dim" />
              <input
                type="password"
                className="w-full rounded-lg border border-max-border bg-max-panel-2 py-2.5 pl-10 pr-3 text-sm text-max-text placeholder:text-max-text-dim/60 outline-none transition focus:border-max-accent focus:ring-2 focus:ring-max-accent/25"
                placeholder="••••••••••••••••"
                value={apiTokenInstance}
                onChange={(e) => setApiTokenInstance(e.target.value)}
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={!idInstance || !apiTokenInstance}
            className="group flex w-full items-center justify-center gap-2 rounded-lg bg-max-accent py-2.5 text-sm font-medium text-white transition hover:bg-max-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Подключиться
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-max-text-dim">Эти данные остаются на вашем устройстве</p>
      </div>
    </div>
  );
};

export default SetupScreen;
