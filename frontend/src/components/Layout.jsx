import { Link, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";

const navItems = [
  { to: "/", label: "Главная" },
  { to: "/upload", label: "Анализ" },
  { to: "/moodboard", label: "Мудборд" },
  { to: "/my-garden", label: "Мой сад" }
];

export function Header() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);

  return (
    <header className="header">
      <Link to="/" className="logo">
        Flora Vision
      </Link>
      <nav className="nav">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link">
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="user-bar">
        {user?.name && <span>{user.name}</span>}
        {token ? (
          <button className="btn btn-outline" onClick={() => dispatch(logout())}>
            Выйти
          </button>
        ) : (
          <Link to="/auth" className="btn btn-primary">
            Войти
          </Link>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return <footer className="footer">Flora Vision · Подбор растений по палитре</footer>;
}

export function Loader({ text = "Загрузка..." }) {
  return <div className="loader">{text}</div>;
}
