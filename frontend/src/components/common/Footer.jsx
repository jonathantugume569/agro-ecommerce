import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  XLogo,
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/agroecom", icon: FacebookLogo },
  { label: "Instagram", href: "https://www.instagram.com/agroecom", icon: InstagramLogo },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/agroecom", icon: LinkedinLogo },
  { label: "X", href: "https://x.com/agroecom", icon: XLogo },
];

function Footer() {
  return (
    <footer className="bg-emerald-900 px-6 py-10 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
        <section>
          <Link to="/products" className="text-2xl font-bold tracking-tight text-white">
            Agro<span className="text-emerald-400">Ecom</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-emerald-100">
            Connecting farmers with trusted agro-dealers and quality farm inputs.
          </p>
        </section>

        <nav aria-label="Footer navigation">
          <h2 className="text-base font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-emerald-100 hover:text-white" to="/products">Products</Link></li>
            <li><Link className="text-emerald-100 hover:text-white" to="/login">Sign in</Link></li>
            <li><Link className="text-emerald-100 hover:text-white" to="/register">Create an account</Link></li>
          </ul>
        </nav>

        <section>
          <h2 className="text-base font-semibold text-white">Connect with us</h2>
          <a className="mt-3 inline-block text-sm text-emerald-100 hover:text-white"
            href="mailto:info@agroecom.com">
            info@agroecom.com<i className="ml-1 "></i>
          </a>
          <div className="mt-4 flex gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                aria-label={label}
                className="rounded-full text-emerald-100 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                <Icon size={24} weight="fill" />
              </a>
            ))}
          </div>
        </section>
      </div>

      <div className="mx-auto mt-8 max-w-6xl border-t border-emerald-800 pt-4 text-sm text-emerald-200">
        &copy; {new Date().getFullYear()} Agro<span className="text-emerald-400">Ecom</span>. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;