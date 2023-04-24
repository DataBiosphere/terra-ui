import PropTypes from "prop-types";
import { Component } from "react";
import { reportError } from "src/libs/error";

// No hook equivalent of componentDidCatch exists yet
export default class ErrorWrapper extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
  };

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    reportError("An error occurred", error);
  }

  render() {
    const { children } = this.props;
    const { hasError } = this.state;
    return hasError ? null : children;
  }
}
