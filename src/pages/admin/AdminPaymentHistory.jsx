import { useEffect, useState } from "react";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { getPaymentHistoryAPI } from "../../services/paymentService";

function AdminPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await getPaymentHistoryAPI();
    
      console.log("💳 Payment history:", data);
      setPayments(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div>
      <AdminNavbar />
      <div className="admin-shell">
        <AdminSidebar />

        <main className="admin-content">
          <h1 className="admin-page-title">Payment History</h1>

          {loading ? (
            <p>Loading payments...</p>
          ) : error ? (
            <p className="smp-error-msg">{error}</p>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Payment ID</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.userName || p.userEmail}</td>
                      <td>{p.planName}</td>
                      <td>₹{p.amount}</td>
                      <td>
                        <span
                          className={
                            p.status === "SUCCESS"
                              ? "status-success"
                              : "status-failed"
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td>
                        {new Date(p.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td>{p.paymentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminPaymentHistory;