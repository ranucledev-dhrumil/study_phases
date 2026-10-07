import Badge from "./Badge.jsx";

function EmployeeCard({ employee }) {
    const { name, role, email } = employee;
  return (
    <>
      <div className="cards">
        <h2>Employee Card for- {name}</h2>
        <p>Role - <Badge>{role}</Badge></p>
        <p>Email - {email}</p>
      </div>
    </>
  );
}

export default EmployeeCard;
