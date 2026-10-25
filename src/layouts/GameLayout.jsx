import { Outlet } from "react-router-dom";
import { useGameEngine } from "../hooks/useGameEngine";
import useInterfacePreferences from "../hooks/useInterfacePreferences";
import useGameAudio from "../hooks/useGameAudio";
export default function GameLayout() {
  const interfaceSettings = useInterfacePreferences();
  const { state, actions, saveStatus } = useGameEngine({
    pauseOnExpiry: interfaceSettings.preferences.pauseOnExpiry,
  });
  const audio = useGameAudio(state);
  return (
    <main id="main-content" tabIndex={-1} className="game-root">
      <Outlet context={{ state, actions, saveStatus, interfaceSettings, audio }} />
    </main>
  );
}
