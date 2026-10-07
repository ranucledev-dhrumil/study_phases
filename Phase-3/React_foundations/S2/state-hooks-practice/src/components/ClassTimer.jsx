import React from "react";

class ClassTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { seconds: 0 }; // fixed: was `count`
    this.resetTimer = this.resetTimer.bind(this); // fixed: bind the method actually used
  }

  //   componentDidMount() runs once, after React puts the component on the screen.
  componentDidMount() {
    this.timer = setInterval(() => {
      this.setState({
        seconds: this.state.seconds + 1,
      });
    }, 1000);
  }

  //   When the component is removed from the page, we need to stop the interval.
  componentWillUnmount() {
    console.log(this.timer + " has been unmounted");
    clearInterval(this.timer);
  }

  resetTimer() {
    this.setState({
      seconds: 0,
    });
  }

  render() {
    return (
      <div>
        <p>classTimer - Elapsed: {this.state.seconds} seconds</p>

        <button onClick={this.resetTimer}>Reset</button>
      </div>
    );
  }
}

export default ClassTimer;
