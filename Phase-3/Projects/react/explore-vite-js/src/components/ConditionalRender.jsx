import { useState } from "react";

function ConditionalRender() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return <>{isLoggedIn ? <p>LoggedIn</p> : <p>Guest</p>}</>;
}

export default ConditionalRender;
