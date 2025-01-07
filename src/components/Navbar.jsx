import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

const Navbar = ({ setIsAuthenticated }) => {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const navLinks = [
    { path: "/", label: "Strona główna" },
    { path: "/workout", label: "Trening" },
    { path: "/meals", label: "Posiłki" },
    { path: "/history", label: "Historia" },
    { path: "/sleep", label: "Sen" },
    { path: "/settings", label: "Ustawienia" },
    { path: "/login", label: "Wyloguj", action: logout },
  ];

  return (
    <header className="bg-[#051094] text-white p-4 rounded-b-md shadow-lg">
      <nav className="container mx-auto">
        <div className="flex justify-between items-center sm:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <IconButton
            onClick={() => setMenu(!menu)}
            className="focus:outline-none"
          >
            {menu ? (
              <CloseIcon style={{ stroke: "white", strokeWidth: 2 }} />
            ) : (
              <MenuIcon style={{ stroke: "white", strokeWidth: 2 }} />
            )}
          </IconButton>
        </div>
        <ul
          className={`flex flex-col sm:flex-row justify-center ${
            menu ? "block" : "hidden"
          } sm:flex gap-0 sm:gap-1.5 md:gap-4 mt-4 sm:mt-0 `}
        >
          {navLinks.map(({ path, label, action }) => (
            <li
              key={path}
              className="text-center border-solid border-white border-2 sm:border-0 py-0 text-lg flex items-center focus:ring-0 focus:ring-offset-0"
            >
              <Link
                to={path}
                onClick={action}
                className="sm:hover:white px-4 py-2 sm:rounded-lg transition duration-200 hover:bg-white hover:text-[#051094] text-center w-full sm:w-auto block"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Navbar;
