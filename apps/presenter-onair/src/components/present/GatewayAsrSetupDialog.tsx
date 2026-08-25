import { UI_QA } from '../../constants/uiZh';
import type { QaAsrEngine } from '../../types/present';

interface GatewayAsrSetupDialogProps {
  open: boolean;
  message?: string;
  onClose: () => void;
  onSwitchEngine: (engine: QaAsrEngine) => void;
}

const SETUP_COMMAND = 'npm run setup:asr';

export function GatewayAsrSetupDialog({
  open,
  message,
  onClose,
  onSwitchEngine,
}: GatewayAsrSetupDialogProps) {
  if (!open) {
    return null;
  }

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_COMMAND);
    } catch {
      // ignore
    }
  };

  return (
    <div className="present-asr-dialog-backdrop" role="presentation">
      <div
        className="present-asr-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gateway-asr-setup-title"
      >
        <h3 id="gateway-asr-setup-title">{UI_QA.gatewaySetupTitle}</h3>
        <p className="present-asr-dialog-lead">
          {message ?? UI_QA.gatewaySetupLead}
        </p>
        <ol className="present-asr-dialog-steps">
          <li>
            打开终端，进入项目目录并执行：
            <div className="present-asr-dialog-cmd-row">
              <code>{SETUP_COMMAND}</code>
              <button type="button" onClick={() => void copyCommand()}>
                {UI_QA.copyCommand}
              </button>
            </div>
          </li>
          <li>
            安装完成后<strong>重启</strong>：
            <code>npm run dev</code>
          </li>
          <li>回到本页，再次选择「本机 Whisper」并试麦。</li>
        </ol>
        <p className="present-asr-dialog-note">{UI_QA.gatewaySetupNote}</p>
        <div className="present-asr-dialog-actions">
          <button
            type="button"
            className="present-asr-dialog-secondary"
            onClick={() => {
              onSwitchEngine('browserWhisper');
              onClose();
            }}
          >
            {UI_QA.switchToBrowserWhisper}
          </button>
          <button
            type="button"
            className="present-asr-dialog-secondary"
            onClick={() => {
              onSwitchEngine('webSpeech');
              onClose();
            }}
          >
            {UI_QA.switchToWebSpeech}
          </button>
          <button
            type="button"
            className="present-asr-dialog-primary"
            onClick={onClose}
          >
            {UI_QA.gatewaySetupDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
