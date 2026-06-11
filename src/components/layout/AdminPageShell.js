import Layout from "../Layout.js";
import AdminNav from "../AdminNav.js";
import PageHeader from "../ui/PageHeader.js";

const AdminPageShell = ({ title, subtitle, actions, children }) => {
  return (
    <Layout user="admin">
      <div className="admin-shell">
        <aside className="admin-sidebar-wrap">
          <AdminNav />
        </aside>

        <main className="admin-main">
          <div className="admin-content">
            <PageHeader title={title} subtitle={subtitle} actions={actions} />
            {children}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default AdminPageShell;
