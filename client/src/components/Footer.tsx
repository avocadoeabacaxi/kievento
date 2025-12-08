export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-muted/30 border-t mt-auto">
      <div className="container py-3">
        <p className="text-xs text-center text-muted-foreground">
          © {currentYear} KiEvento By Lab485/Avocado. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
