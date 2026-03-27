export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 text-xs">
            <p>&copy; {year} Natafuta. Tous droits réservés.</p>
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-blue-300">À propos</a>
            <a href="#" className="hover:text-blue-300">Confidentialité</a>
            <a href="#" className="hover:text-blue-300">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
