import {
  ListIcon,
  PlantIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  ReceiptIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function handleLogout() {
    logout();
    closeDrawer();
  }

  const links = [
    { label: "Products", to: "/products", icon: <PlantIcon size={20} /> },
    ...(isAuthenticated
      ? [
          { label: "Cart", to: "/cart", icon: <ShoppingCartIcon size={20} /> },
          { label: "Orders", to: "/orders", icon: <ReceiptIcon size={20} /> },
        ]
      : []),
  ];

  return (
    <header className="relative z-20 border-b border-emerald-800 bg-emerald-950 text-white h-20">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 md:px-16 lg:px-32 py-3 h-20">
        <Link
          className="text-xl font-bold tracking-tight text-white"
          style={{ fontFamily: "Playfair Display, serif" }}
          to="/products"
          onClick={closeDrawer}
        >
          <img
            src="/img/logo.png"
            alt="AgroEcom Logo"
            className="inline-block h-8 w-8 rounded-full mr-2"
          />
          <span
            className="text-emerald-400"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Agro
          </span>
          Ecom
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Main navigation"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm text-emerald-50 transition hover:text-white ${
                  isActive ? "font-bold" : ""
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/profile">
          {({ isActive }) => (
            <div
              className={`hidden items-center gap-2 text-sm text-emerald-100 md:flex ${
                isActive ? "font-bold" : ""
              }`}
            >
              <UserCircleIcon size={28} weight="fill" aria-hidden="true" />
              <span>{user?.username || "Guest"}</span>
            </div>
          )}
        </NavLink>

        <button
          aria-expanded={drawerOpen}
          aria-label={
            drawerOpen ? "Close navigation menu" : "Open navigation menu"
          }
          className="inline-flex rounded-lg p-2 text-emerald-100 transition hover:bg-emerald-800 hover:text-white md:hidden"
          type="button"
          onClick={() => setDrawerOpen((open) => !open)}
        >
          {drawerOpen ? <XIcon size={26} /> : <ListIcon size={26} />}
        </button>
      </div>

      {drawerOpen && (
        <div className="absolute inset-x-0 h-full md:hidden">
          <button
            className="fixed inset-0 h-screen w-screen cursor-default bg-slate-950/40"
            type="button"
            aria-label="Close navigation menu"
            onClick={closeDrawer}
          />
          <nav
            className="relative ml-auto flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-1 border-t border-emerald-800 bg-emerald-900 p-4 shadow-xl"
            aria-label="Mobile navigation"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeDrawer}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-3 text-left text-sm text-emerald-100 transition hover:bg-emerald-800 hover:text-white ${
                    isActive ? "font-bold" : "font-medium"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                className="rounded-lg border-0 bg-transparent px-3 py-3 text-left text-sm font-medium text-emerald-100 transition hover:bg-emerald-800 hover:text-white"
                type="button"
                onClick={handleLogout}
              >
                Sign out
              </button>
            ) : (
              <>
                <NavLink
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-3 text-left text-sm text-emerald-100 transition hover:bg-emerald-800 hover:text-white ${
                      isActive ? "font-bold" : "font-medium"
                    }`
                  }
                  to="/login"
                  onClick={closeDrawer}
                >
                  Sign in
                </NavLink>
                <Link
                  className="mt-2 rounded-lg bg-emerald-500 px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-400"
                  to="/register"
                  onClick={closeDrawer}
                >
                  Create an account
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
