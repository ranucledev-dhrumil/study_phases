function ListComponent() {
  const users = [
    { id: 1, name: "Mark" },
    { id: 2, name: "Steven" },
    { id: 3, name: "Jack" },
  ];

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

export default ListComponent;
