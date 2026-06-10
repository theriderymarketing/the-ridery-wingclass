export default function WidgetLayout({ children }) {
  // Le widget est conçu pour être affiché dans une iframe.
  // On s'assure qu'il n'y a pas la sidebar administrateur de l'app principale.
  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
      {children}
    </div>
  );
}
