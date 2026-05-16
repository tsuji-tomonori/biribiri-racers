import { IconButton } from "./IconButton";

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
}

export function Modal({ title, open, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <IconButton className="close" aria-label="閉じる" onClick={onClose}>×</IconButton>
        <h2 id="modal-title">{title}</h2>
        <p>矢印キーまたは WASD でカートを動かします。電撃のかべに触れたらスタートへ戻り、接触回数が増えます。</p>
        <p>Space で短くブーストできます。規定ラップを走りきるとリザルトへ進みます。</p>
        <p>コード参加、フレンド、共有、オンラインランキングは未接続のため、実データとしては表示しません。</p>
      </div>
    </div>
  );
}
