type Props = {
  type: "info" | "success" | "error";
  message: string;
};

export function StatusBanner({ type, message }: Props) {
  return <div className={`status-banner ${type}`}>{message}</div>;
}
