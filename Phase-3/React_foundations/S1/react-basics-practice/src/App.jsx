import "./App.css";
import EmployeeCard from "./components/EmployeeCard";
import PageHeader from "./components/PageHeader";

function App() {
  const employees = [
    { name: "John Doe", role: "Frontend Developer", email: "john@example.com" },
    { name: "Jane Smith", role: "UI/UX Designer", email: "jane@example.com" },
    {
      name: "Mike Johnson",
      role: "Backend Developer",
      email: "mike@example.com",
    },
  ];

  return (
    <>
      <PageHeader title={"Employees"}>
        <p>Employee Details</p>
      </PageHeader>
      <section id="center">
        <div className="hero">
          {employees.map((employee) => (
            <EmployeeCard 
              key={employee.email}
              employee={employee} 
            />
          ))}
        </div>
        <p>{employees.length}</p>
      </section>
    </>
  );
}

export default App;
