import { useEffect } from 'react';

function HelloComponent() {
  useEffect(() => {
    console.log("Component Mounted");
  }, []); 

  return <p>Hello React!</p>;
}

export default HelloComponent;   