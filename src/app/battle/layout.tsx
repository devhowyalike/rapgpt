/**
 * Battle route layout
 * Marks pages as fullscreen to hide the footer
 * If you need to show the footer, consider adding it will disrupt height caculations used mostly for sticky headers
 */
export default function BattleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div data-fullscreen-page="">{children}</div>;
}

