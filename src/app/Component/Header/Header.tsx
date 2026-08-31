import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.css";

export default function Header() {

  const mainLinks = [
    { href: "/Teams", label: "Teams" },
    { href: "/Matches", label: "Matches" },
    { href: "/Rankings", label: "Rankings" },
    { href: "/Archive", label: "Archive" },
  ];

  return (
    <header className={styles.headerContainer}>
      <div className={styles.innerContainer}>
        
        {/* =========================================
            左側：ロゴとトップページリンク
            ========================================= */}
        <Link href="/" className={styles.logoGroup}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 bg-[#0a0a0a] border border-white/10 flex items-center justify-center transform -skew-x-12 overflow-hidden relative transition-colors duration-300 group-hover:border-yellow-500 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="transform skew-x-12 relative w-full h-full">
              <Image
                src="/pmlogo.jpg"
                alt="PM LEAGUE Logo"
                width={80}
                height={80}
                className="object-cover"
                priority
              />
            </div>
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className={`text-xs sm:text-sm md:text-xl leading-none font-black italic tracking-tight whitespace-nowrap ${styles.logoText}`}>
              PM LEAGUE
            </span>
            <span className="hidden sm:block text-[7px] md:text-[8px] text-yellow-600 tracking-widest uppercase font-bold mt-0.5 whitespace-nowrap">
              Official Website
            </span>
          </div>
        </Link>

        {/* =========================================
            右側：ナビゲーションとボタン
            ========================================= */}
        <nav className={styles.navWrapper}>
          
          <div className={styles.navLinks}>
            {mainLinks.map((item) => (
              <Link key={item.href} href={item.href} className={styles.navLink}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className={styles.authSection}>
            <div className="flex items-center gap-3">
              <Link href="/Admin" className={styles.skewBtnAdmin}>
                <span>Admin</span>
              </Link>
              <Link href="/Login" className={styles.skewBtnLogin}>
                <span>Login</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className={styles.mobileMenu}>
          <input id="mobile-nav-toggle" type="checkbox" className={styles.mobileMenuToggle} />
          <label htmlFor="mobile-nav-toggle" className={styles.mobileMenuSummary}>Menu</label>
          <label htmlFor="mobile-nav-toggle" className={styles.mobileMenuOverlay} aria-hidden="true" />

          <div className={styles.mobileMenuPanel}>
            <div className={styles.mobileLinkList}>
              {mainLinks.map((item) => (
                <Link key={`mobile-${item.href}`} href={item.href} className={styles.mobileLink}>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className={styles.mobileAuthArea}>
              <Link href="/Admin" className={`${styles.mobileBtn} ${styles.mobileBtnAdmin}`}>
                Admin
              </Link>
              <Link href="/Login" className={`${styles.mobileBtn} ${styles.mobileBtnLogin}`}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}