import "./App.css";
import CounterComponent from "./components/CounterComponent";
import HelloComponent from "./components/HelloComponent";
import ListComponent from "./components/ListComponent";
import MaterialUiCard from "./components/MaterialUiCard";
import StyledButton from "./components/StyledButton";
import ControlledEmail from "./components/ControlledEmail";
import ConditionalRender from "./components/ConditionalRender";
import FetchUsingAxios from "./components/FetchUsingAxios";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <div className="m-10 border-2 border-solid">
        <HelloComponent />
      </div>
      <div className="m-10 border-2 border-solid">
        <CounterComponent />
      </div>
      <div className="m-10 border-2 border-solid">
        <ListComponent />
      </div>
      <div className="m-10 border-2 border-solid">
        <StyledButton />
      </div>
      <div className="m-10">
        <MaterialUiCard />
      </div>
      <div className="m-10">
        <ControlledEmail />
      </div>
      <div className="m-10">
        <ConditionalRender />
      </div>
      <div className="m-10">
        <ProtectedRoute>
          <FetchUsingAxios />
        </ProtectedRoute>
      </div>
    </>
  );
}

export default App;
