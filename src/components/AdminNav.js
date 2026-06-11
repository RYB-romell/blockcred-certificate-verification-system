// src/components/AdminNav.js

import { useLocation, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaClipboardList,
  FaFileSignature,
  FaFolderOpen,
  FaCog,
  FaCreditCard,
  FaSearch,
  FaShieldAlt,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import BrandLogo from "./BrandLogo.js";

const AdminNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin-dashboard",
      icon: <FaChartLine />,
    },
    {
      label: "Issue",
      path: "/admin-certificate",
      icon: <FaFileSignature />,
    },
    {
      label: "Students",
      path: "/admin-students",
      icon: <FaUsers />,
    },
    {
      label: "Certificates",
      path: "/admin-certificates",
      icon: <FaFolderOpen />,
    },
    {
      label: "Activity Log",
      path: "/admin-activity-logs",
      icon: <FaClipboardList />,
    },
    {
      label: "Payments",
      path: "/admin-payments",
      icon: <FaCreditCard />,
    },
    {
      label: "Institution Settings",
      path: "/admin-settings",
      icon: <FaCog />,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: <FaUserCircle />,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className="admin-sidebar">
        <div className="admin-side-brand">
          <BrandLogo
            size="md"
            showText
            subtitle="Institution workspace"
            variant="light"
          />
        </div>

        <nav className="admin-side-nav">
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`admin-side-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="admin-side-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-side-footer">
          <p className="admin-side-group-label">Tools</p>
          <button
            type="button"
            onClick={() => navigate("/public-verifier")}
            className="admin-side-verifier"
          >
            <FaSearch />
            Public Verifier
          </button>
        </div>
      </div>

      <div className="admin-mobile-nav">
        <div className="admin-mobile-scroll">
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`admin-mobile-link ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => navigate("/public-verifier")}
            className="admin-mobile-link"
          >
            <FaShieldAlt />
            Verifier
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminNav;
